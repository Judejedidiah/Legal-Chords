-- =====================================================
-- LEGAL CHORDS — Migration 004: Full editable site content
-- Run this in the Supabase SQL Editor after 001-003.
-- Defines the canonical JSON shape for EVERY homepage
-- section so admins can edit all of it from the CMS.
-- =====================================================

INSERT INTO site_content (section_key, section_label, content) VALUES

('hero', 'Hero Section', '{
  "badge": "Youth-Led • Nigeria • Est. 2026",
  "headline": { "line1": "LEGAL KNOWLEDGE", "line2": "SHOULD NOT BE", "line3": "A PRIVILEGE.", "accentLine": 2 },
  "subtitle": "Making the law easier to understand, access, and apply. Legal Chords is a youth-focused legal awareness platform making legal education practical, accessible and relevant to everyday life.",
  "primaryAction": "Explore Legal Chords",
  "primaryHref": "#programs",
  "secondaryAction": "Join Legal Chords",
  "secondaryHref": "#get-involved",
  "trust": ["Legal Awareness", "Youth Development", "Leadership", "Innovation"],
  "cardLabel": "Daily Legal Nuggets",
  "cardTag": "RIGHTS & RESPONSIBILITIES",
  "cardTitle": "Know Your Rights.",
  "cardText": "Simple, practical legal education designed for everyday life, not just for lawyers.",
  "cardMeta1": "Webinar Series",
  "cardMeta2": "Live Sessions",
  "float1Title": "Verified Knowledge",
  "float1Sub": "Practical & accurate",
  "float2Title": "Community",
  "float2Sub": "100+ young minds",
  "float3Title": "Innovation Meets Law",
  "float3Sub": "New initiative"
}'),

('marquee', 'Keyword Marquee', '{
  "items": ["Legal Awareness", "Legal Education", "Youth Development", "Leadership", "Innovation Meets Law", "Access to Justice", "Community"]
}'),

('about', 'About Section', '{
  "eyebrow": "About Legal Chords",
  "heading": { "text": "Law Should Be", "accent": "Understandable." },
  "lede": "Legal Chords exists to bridge the gap between people and legal knowledge. We are a youth-focused legal awareness and education platform committed to making legal knowledge simple, practical and accessible.",
  "paragraphs": [
    "Through digital education, conversations, webinars, events and community initiatives, we help young people understand their rights, responsibilities and the legal systems that affect their everyday lives.",
    "We are not a law firm. We are a movement of young people, professionals and educators using education, innovation and collaboration to make the law a tool for empowerment, not intimidation."
  ],
  "linkText": "See what we do",
  "linkHref": "#what-we-do",
  "stats": [
    { "num": 3, "label": "Years Building\nLegal Awareness" },
    { "num": 100, "label": "Community Members\nReached" },
    { "num": "Multiple", "label": "Educational Programs\n& Initiatives" }
  ]
}'),

('mission', 'Mission', '{
  "eyebrow": "Our Mission",
  "heading": "Make legal knowledge accessible, understandable and practical for everyone.",
  "body": "We exist to simplify the law and bring it into everyday conversations, classrooms and communities, so that no one is excluded because the language is too dense or the system too distant."
}'),

('vision', 'Vision', '{
  "eyebrow": "Our Vision",
  "heading": "A society where people understand the law well enough to know their rights, fulfill their responsibilities and make informed decisions.",
  "body": "A Nigeria and a generation that leads with knowledge, participates with confidence and shapes the future with clarity."
}'),

('what', 'What We Do', '{
  "eyebrow": "What We Do",
  "heading": { "text": "Six ways we make the law", "accent": "practical." },
  "lede": "We work at the intersection of law, education, technology and youth development, building a generation that understands the rules of the game.",
  "cards": [
    { "title": "Legal Education", "text": "Breaking down complex legal concepts into simple, understandable information." },
    { "title": "Legal Awareness", "text": "Creating awareness about rights, responsibilities, laws and everyday legal issues." },
    { "title": "Youth Development", "text": "Equipping young people with knowledge, confidence and leadership skills." },
    { "title": "Leadership & Civic Engagement", "text": "Encouraging ethical leadership, responsible citizenship and meaningful participation." },
    { "title": "Events & Conversations", "text": "Hosting webinars, summits, workshops, panel discussions and physical events." },
    { "title": "Law, Technology & Innovation", "text": "Exploring how law intersects with technology, startups, digital rights and IP." }
  ]
}'),

('programs', 'Programs Section', '{
  "eyebrow": "Our Programs",
  "heading": { "text": "A living platform for", "accent": "legal learning." },
  "lede": "Five flagship programs turning legal awareness into action, from short daily lessons to flagship summits.",
  "cards": [
    { "tag": "Flagship", "title": "Legal Chords Summit", "text": "A flagship platform bringing young people, legal professionals, leaders and changemakers together for bold conversations about law, justice and society.", "meta": ["Annual", "Multi-city", "Hybrid"], "linkText": "Learn More", "linkHref": "#" },
    { "tag": "Education", "title": "Legal Nuggets", "text": "Short, practical legal education designed for everyday life, knowledge you can actually use.", "meta": ["Weekly", "Digital"], "linkText": "Learn More", "linkHref": "#" },
    { "tag": "Conversation", "title": "Legal Chords Webinars", "text": "Interactive conversations on law, rights, leadership and society with experts and practitioners.", "meta": ["Weekly", "Live"], "linkText": "Learn More", "linkHref": "#" },
    { "tag": "Innovation", "title": "Innovation Meets Law", "text": "Exploring the intersection between law, technology, entrepreneurship and innovation.", "meta": ["Series", "Cross-sector"], "linkText": "Learn More", "linkHref": "#" },
    { "tag": "Leadership", "title": "Leadership Training", "text": "Developing character, mindset and practical leadership skills among young people.", "meta": ["Cohort", "Mentorship"], "linkText": "Learn More", "linkHref": "#" }
  ]
}'),

('events', 'Featured Event', '{
  "sectionEyebrow": "Featured Event",
  "sectionHeading": { "text": "What''s Happening at", "accent": "Legal Chords?" },
  "sectionLede": "Legal Chords is an active organization. Here is what is coming up next, join the conversation, share your perspective and connect with change.",
  "tag": "Upcoming",
  "day": "14",
  "month": "NOV",
  "title": "Legal Chords Summit 2026",
  "subtitle": "Law • Innovation • Youth",
  "typePill": "Summit",
  "formatPill": "Hybrid",
  "heading": "Legal Chords Summit 2026: The Next Generation of Ethical Leaders",
  "description": "A flagship gathering of young leaders, lawyers, technologists and policymakers shaping the future of law, civic engagement and innovation in Nigeria and across Africa.",
  "date": "Saturday, 14 November 2026",
  "time": "10:00 AM to 4:00 PM (WAT)",
  "format": "Hybrid (Lagos + Online)",
  "speakers": "20+ legal, civic & tech leaders",
  "registerText": "Register Now",
  "registerHref": "#",
  "allText": "View All Events →",
  "allHref": "#",
  "posterImage": ""
}'),

('community', 'Community Section', '{
  "eyebrow": "The Legal Chords Community",
  "heading": { "text": "Learn.", "accent": "Connect.", "suffix": "Lead." },
  "lede": "Join a growing community of young people interested in law, leadership, innovation, justice and personal development.",
  "buttonText": "Join the Community",
  "buttonHref": "#get-involved",
  "benefits": [
    { "num": "01", "title": "Access to Legal Education", "text": "Courses, articles, and Legal Nuggets made for everyday understanding." },
    { "num": "02", "title": "Webinars & Events", "text": "Live conversations and experiences with lawyers, leaders and innovators." },
    { "num": "03", "title": "Leadership Opportunities", "text": "Step into roles that sharpen your voice, your judgement and your impact." },
    { "num": "04", "title": "Volunteer Opportunities", "text": "Contribute your time, skills and creativity to the mission." },
    { "num": "05", "title": "Networking", "text": "Connect with changemakers across universities and cities." },
    { "num": "06", "title": "Youth-Focused Resources", "text": "Toolkits, guides and templates tailored to young people''s realities." }
  ]
}'),

('impact', 'Impact Section', '{
  "eyebrow": "Our Impact",
  "heading": { "text": "Numbers that", "accent": "tell a story." },
  "lede": "Legal awareness is not a slogan. It is a measurable shift in how people understand and exercise their rights.",
  "stats": [
    { "num": 200, "label": "Community Members", "sub": "Young people reached across programs" },
    { "num": 15, "label": "Educational Sessions", "sub": "Webinars, workshops and Legal Nuggets" },
    { "num": "Multiple", "label": "University Partnerships", "sub": "Building presence on campuses" },
    { "num": "Growing", "label": "Young People Reached", "sub": "Across cities and online communities" }
  ],
  "mapHeading": "Expanding across Nigeria.",
  "mapText": "From Lagos to Kano, Abuja to Kaduna, Legal Chords is building a national footprint of legal awareness, education and youth empowerment.",
  "mapNote": "Editable metrics, easy to update from your CMS as the organization grows."
}'),

('partners', 'Partners & Collaborators', '{
  "eyebrow": "Partners & Collaborators",
  "heading": { "text": "Building impact", "accent": "through collaboration." },
  "lede": "We believe meaningful impact happens through collaboration. Legal Chords works with institutions, student communities, professionals, organizations and changemakers to expand access to legal knowledge.",
  "list": ["Partner Logo", "University", "NGO", "Community", "Organization", "Innovation Hub"],
  "thegenz": {
    "logo": "assets/thegenzlogo.png",
    "name": "TheGenZ AI Hub",
    "description": "TheGenZ AI Hub is an institutional venture-building ecosystem. We are not a coding bootcamp, a passive consultancy, a generic meetup group, or an AI news aggregator. We operate as a repeatable foundry that brings together ambitious developers, verified real-world problems, rigorous validation methodologies, and venture resources so that promising ideas turn into enduring companies."
  }
}'),

('resources', 'Resources / Legal Education Hub', '{
  "eyebrow": "Resources / Legal Education Hub",
  "heading": { "text": "Read.", "accent": "Learn.", "suffix": "Apply." },
  "lede": "Editorial-style legal education, written for clarity, designed for relevance, and updated as society evolves.",
  "tabs": ["All", "Legal Nuggets", "Articles", "Youth & Law", "Leadership", "Technology & Law", "Rights & Responsibilities"],
  "articles": [
    {
      "cat": "RIGHTS & RESPONSIBILITIES",
      "title": "5 Legal Rights Every Nigerian Youth Should Know",
      "text": "A simple guide to the rights that protect you in everyday situations, from arrest to online expression.",
      "date": "Nov 02, 2026",
      "image": "",
      "body": "Every young Nigerian has rights that exist whether or not they can afford a lawyer. The Constitution and a growing body of statutes protect your person, your expression and your property. Knowing them is the first step to using them.\n\nYou have the right to dignity and freedom from torture. Section 34 of the 1999 Constitution prohibits inhuman treatment, and confessions obtained through force are not admissible in court.\n\nYou also have the right to peaceful assembly and association, to freedom of expression and to own property. On the internet, the Cybercrimes Act does not erase these rights. If you are arrested, you have the right to remain silent, to be told why you are being held, and to contact a lawyer or anyone of your choice.",
      "linkText": "Read More",
      "linkHref": "#"
    },
    {
      "cat": "TECHNOLOGY & LAW",
      "title": "Digital Rights in Nigeria: What the Law Actually Says",
      "text": "Demystifying cyber laws, data protection and online freedoms for young creators and users.",
      "date": "Oct 28, 2026",
      "image": "",
      "body": "Nigeria''s digital space is governed by a patchwork of laws: the Cybercrimes Act, the Nigeria Data Protection Act, and constitutional guarantees of privacy and expression.\n\nThe Cybercrimes Act criminalises fraud, identity theft and certain forms of harassment, but it has also raised concerns about vague offences and the prosecution of online speech. Courts have increasingly insisted that its provisions must be read in light of the Constitution.\n\nThe Nigeria Data Protection Act gives you rights over your personal data, including the right to know what is collected, to correct it, and to object to certain uses. For young creators, that means you can ask platforms and organisations to explain how they handle your information.",
      "linkText": "Read More",
      "linkHref": "#"
    },
    {
      "cat": "LEADERSHIP",
      "title": "From Awareness to Action: Leading with Legal Literacy",
      "text": "How understanding the law transforms leadership in student unions, startups and communities.",
      "date": "Oct 20, 2026",
      "image": "",
      "body": "Legal literacy is not just about staying out of trouble. It changes how you lead. A student union leader who understands due process runs fairer elections, and a founder who understands contracts protects both the business and its customers.\n\nLeadership built on legal literacy is also leadership built on trust. When people see that decisions follow known rules and that disagreements are resolved fairly, they commit more fully to the work.\n\nThe goal is not to turn every young leader into a lawyer, but to make the law a normal part of how decisions are made, from campus societies to community initiatives.",
      "linkText": "Read More",
      "linkHref": "#"
    },
    {
      "cat": "LEGAL NUGGETS",
      "title": "Renting in Nigeria: A Quick Legal Nugget",
      "text": "What every tenant and landlord should know before signing a lease, short and practical.",
      "date": "Oct 14, 2026",
      "image": "",
      "body": "Before you sign a tenancy agreement, confirm who actually owns the property and who has the authority to lease it. Ask for the landlord''s details and, where possible, a title document or an agent''s mandate.\n\nPut every important term in writing: the rent, the duration, the notice period, the deposit and how it will be refunded, and who is responsible for repairs. Verbal promises are difficult to enforce later.\n\nKnow your state''s tenancy law and any applicable rent control regime. If a dispute arises, document everything in writing and seek advice early rather than allowing the matter to escalate.",
      "linkText": "Read More",
      "linkHref": "#"
    },
    {
      "cat": "YOUTH & LAW",
      "title": "Starting a Business as a Young Nigerian: Legal Basics",
      "text": "Registration, intellectual property, contracts and the legal foundation of entrepreneurship.",
      "date": "Oct 05, 2026",
      "image": "",
      "body": "Every business has a legal shape. For many young founders, the practical starting point is registering a business name with the Corporate Affairs Commission, while a limited liability company becomes preferable once you take on partners or investors.\n\nProtect your brand early. Registering a trademark with the Nigerian trademark registry gives you exclusive rights to your name and logo within your class of goods or services.\n\nGet contracts right from the start: founder agreements, customer terms, and contracts with freelancers and vendors. A short written agreement that records what each party expects is one of the cheapest protections a young business can have.",
      "linkText": "Read More",
      "linkHref": "#"
    },
    {
      "cat": "ARTICLES",
      "title": "Why Legal Awareness is the New Civic Literacy",
      "text": "A longer read on why legal education belongs in every school, household and movement.",
      "date": "Sep 28, 2026",
      "image": "",
      "body": "For a democracy to work, citizens must understand not only how to vote but also how power is limited. Legal awareness is the difference between knowing that you have rights and knowing how to claim them.\n\nIn schools, workplaces and online spaces, the people who understand the law are better equipped to participate, to challenge unfairness and to hold institutions accountable. Legal literacy is civic literacy.\n\nThat is why legal education belongs in every school, household and movement. It is not a subject reserved for lawyers; it is a life skill for everyone.",
      "linkText": "Read More",
      "linkHref": "#"
    }
  ],
  "ctaText": "Open the Legal Dictionary",
  "ctaHref": "dictionary.html"
}'),

('get-involved', 'Get Involved', '{
  "eyebrow": "Get Involved",
  "heading": { "text": "Don''t just learn.", "accent": "Help us create impact." },
  "lede": "Whether you''re a student, professional, creative, researcher, communicator or changemaker, there is a place for you to contribute to the Legal Chords mission.",
  "cards": [
    { "title": "Become a Volunteer", "text": "Join our team of contributors: write, design, organize, mentor, research.", "href": "#" },
    { "title": "Partner With Us", "text": "Universities, NGOs, brands and government bodies, let''s build together.", "href": "#" },
    { "title": "Support Our Work", "text": "Help fund programs, scholarships, summits and outreach to new communities.", "href": "#" }
  ]
}'),

('testimonials', 'Testimonials', '{
  "eyebrow": "Voices from the Community",
  "heading": { "text": "What our community", "accent": "says." },
  "items": [
    { "quote": "Legal Chords made me realize that the law isn''t just for lawyers. The Legal Nuggets series changed how I make decisions about work, contracts and even online content.", "name": "Adaeze O.", "role": "Student, University of Lagos", "avatar": "A" },
    { "quote": "Speaking at the Legal Chords Webinar was one of the most engaging youth conversations I''ve been part of. They understand how to make the law relevant.", "name": "Kelechi N.", "role": "Legal Practitioner & Speaker", "avatar": "K" },
    { "quote": "Volunteering with Legal Chords sharpened my communication, research and community skills. It''s the kind of platform that grows people.", "name": "Tobi A.", "role": "Volunteer & Law Student", "avatar": "T" },
    { "quote": "The Innovation Meets Law program opened my eyes to how technology and the law intersect. It shaped my final year project and career direction.", "name": "Mariam B.", "role": "Tech & Law Enthusiast", "avatar": "M" },
    { "quote": "Partnering with Legal Chords on our civic literacy campaign brought real, measurable engagement from students. They are building something important.", "name": "David E.", "role": "Partner Organization", "avatar": "D" }
  ]
}'),

('cta', 'Final Call To Action', '{
  "eyebrow": "A New Generation of Legal Citizens",
  "heading": { "text": "Knowledge creates power.", "accent": "Legal knowledge creates protection." },
  "body": "Be part of a generation that understands the law, knows its rights and leads with purpose.",
  "buttons": [
    { "label": "Join The Community", "href": "https://chat.whatsapp.com/B4jgGjfF7tYKxDFowlYlWF" },
    { "label": "Explore Our Programs", "href": "#programs" }
  ]
}'),

('footer', 'Footer', '{
  "brandText": "Making legal knowledge accessible, practical and understandable for a new generation of Nigerian changemakers.",
  "social": ["#", "#", "#", "#", "mailto:hello@legalchords.ng"],
  "columns": [
    { "title": "Explore", "links": [
      { "label": "About", "href": "#about" },
      { "label": "Programs", "href": "#programs" },
      { "label": "Events", "href": "#events" },
      { "label": "Resources", "href": "#resources" },
      { "label": "Legal Dictionary", "href": "dictionary.html" },
      { "label": "Our Impact", "href": "#impact" }
    ] },
    { "title": "Get Involved", "links": [
      { "label": "Volunteer", "href": "#" },
      { "label": "Partner With Us", "href": "#" },
      { "label": "Join the Community", "href": "#" },
      { "label": "Support Us", "href": "#" }
    ] },
    { "title": "Connect", "links": [
      { "label": "Instagram", "href": "#" },
      { "label": "Facebook", "href": "#" },
      { "label": "LinkedIn", "href": "#" },
      { "label": "X / Twitter", "href": "#" },
      { "label": "Email", "href": "mailto:hello@legalchords.ng" }
    ] }
  ],
  "newsletterTitle": "Stay Updated",
  "newsletterNote": "Get Legal Nuggets and updates straight to your inbox.",
  "newsletterPlaceholder": "Your email",
  "copyright": "© 2026 Legal Chords. All rights reserved.",
  "disclaimerHtml": { "text": "Legal Chords provides legal awareness and educational content and does not provide individual legal representation or legal advice.", "linkText": "Terms & Conditions", "linkHref": "terms.html" }
}')

ON CONFLICT (section_key) DO UPDATE
  SET section_label = EXCLUDED.section_label,
      content = EXCLUDED.content,
      updated_at = now();