// Supabase Edge Function: admin-login
// Enforces IP/account rate limiting, blocks brute force, resolves real IP safely behind proxies
// Uses Postgres as shared store, logs block events

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ADMIN_EMAIL = "legalchords@gmail.com";
const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const BLOCK_MINUTES = 30;
const GENERIC_ERROR = "Invalid credentials. Please try again.";

function getRealClientIp(req: Request): string {
  // Trust only common proxy headers in priority order; parse X-Forwarded-For safely
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp && cfConnectingIp.trim()) {
    return cfConnectingIp.trim().split(",")[0].trim();
  }
  const trueClientIp = req.headers.get("true-client-ip");
  if (trueClientIp && trueClientIp.trim()) {
    return trueClientIp.trim().split(",")[0].trim();
  }
  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp && xRealIp.trim()) {
    return xRealIp.trim().split(",")[0].trim();
  }
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor && xForwardedFor.trim()) {
    // Take rightmost IP (appended by closest/trusted proxy) to reduce spoofing
    const parts = xForwardedFor.split(",").map(p => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  }
  // Fallback - do not trust arbitrary client headers
  return "unknown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: GENERIC_ERROR }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    const ip = getRealClientIp(req);
    const now = new Date();

    // Check blocks for IP and email
    const { data: blocks } = await supabase
      .from("admin_login_blocks")
      .select("*")
      .in("key_value", [ip, email])
      .gt("blocked_until", now.toISOString());

    if (blocks && blocks.length > 0) {
      // Find most restrictive block
      let maxRetryAfterSec = 0;
      for (const b of blocks) {
        const blockedUntil = new Date(b.blocked_until);
        const retryAfterSec = Math.max(0, Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000));
        if (retryAfterSec > maxRetryAfterSec) maxRetryAfterSec = retryAfterSec;
      }
      return new Response(JSON.stringify({ error: GENERIC_ERROR }), {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(maxRetryAfterSec),
        },
      });
    }

    // Enforce allowlist server-side
    if (email !== ALLOWED_ADMIN_EMAIL) {
      // Record failed attempt
      await supabase.from("admin_login_attempts").insert({ ip, email, success: false });
      await checkAndCreateBlocks(supabase, ip, email, now);
      return new Response(JSON.stringify({ error: GENERIC_ERROR }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      await supabase.from("admin_login_attempts").insert({ ip, email, success: false });
      await checkAndCreateBlocks(supabase, ip, email, now);
      return new Response(JSON.stringify({ error: GENERIC_ERROR }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Success - reset counters (delete recent attempts for this IP and email)
    const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60 * 1000).toISOString();
    await supabase.from("admin_login_attempts").delete().eq("ip", ip).gte("created_at", windowStart);
    await supabase.from("admin_login_attempts").delete().eq("email", email).gte("created_at", windowStart);
    // Remove blocks
    await supabase.from("admin_login_blocks").delete().eq("key_type", "ip").eq("key_value", ip);
    await supabase.from("admin_login_blocks").delete().eq("key_type", "email").eq("key_value", email);

    return new Response(
      JSON.stringify({
        session: data.session,
        user: data.user,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: GENERIC_ERROR }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function checkAndCreateBlocks(supabase: any, ip: string, email: string, now: Date) {
  const windowStart = new Date(now.getTime() - WINDOW_MINUTES * 60 * 1000).toISOString();
  
  // Count failed attempts in window for IP
  const { count: ipFails } = await supabase
    .from("admin_login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("success", false)
    .gte("created_at", windowStart);
  
  // Count failed attempts in window for email
  const { count: emailFails } = await supabase
    .from("admin_login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .eq("success", false)
    .gte("created_at", windowStart);
  
  const blockedUntil = new Date(now.getTime() + BLOCK_MINUTES * 60 * 1000).toISOString();
  
  if ((ipFails || 0) >= MAX_ATTEMPTS) {
    await supabase.from("admin_login_blocks").upsert({
      key_type: "ip",
      key_value: ip,
      blocked_until: blockedUntil,
      reason: "too_many_failed_attempts",
      last_triggered_at: now.toISOString(),
    }, { onConflict: "key_type,key_value" });
    // Log block event
    console.log(JSON.stringify({ event: "admin_login_block", key_type: "ip", key_value: ip, blocked_until: blockedUntil }));
  }
  
  if ((emailFails || 0) >= MAX_ATTEMPTS) {
    await supabase.from("admin_login_blocks").upsert({
      key_type: "email",
      key_value: email,
      blocked_until: blockedUntil,
      reason: "too_many_failed_attempts",
      last_triggered_at: now.toISOString(),
    }, { onConflict: "key_type,key_value" });
    console.log(JSON.stringify({ event: "admin_login_block", key_type: "email", key_value: email, blocked_until: blockedUntil }));
  }
}
