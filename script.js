const data = window.LAB_DATA;
const body = document.body;
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelectorAll(".site-nav a");
const year = document.querySelector("#year");
const publicationSearch = document.querySelector("#publication-search");
const publicationButtons = document.querySelectorAll("[data-pub-filter]");

let publicationFilter = "all";

const journalNames = [
  "IEICE Transactions on Fundamentals of Electronics, Communications and Computer Sciences",
  "Engineering Applications of Artificial Intelligence",
  "Journal of Information and Communication Convergence Engineering",
  "KSII Transactions on Internet and Information Systems",
  "Sustainable Energy, Grids and Networksnternational Journal of Energy Research",
  "IEICE Transactions on Information and Systems",
  "Energy Conversion and Management",
  "Expert Systems with Applications",
  "Sustainable Energy, Grids and Networks",
  "Sustainable Cities and Society",
  "Computers, Materials & Continua",
  "Gas Science and Engineering",
  "Knowledge-Based Systems",
  "Journal of Internet Technology",
  "Journal of Energy Storage",
  "Vehicular Communications",
  "Sensors and Materials",
  "Applied Soft Computing",
  "Energy and Buildings",
  "Scientific Reports",
  "IEEE Internet of Things",
  "IEEE Sensors",
  "Applied Sciences",
  "Applied Energy",
  "IEEE Access",
  "Electronics",
  "Sensors",
  "Wireless Networks",
].sort((a, b) => b.length - a.length);

const make = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

const appendTextParagraphs = (target, paragraphs) => {
  target.textContent = "";
  paragraphs.forEach((paragraph) => target.append(make("p", "", paragraph)));
};

const setText = (selector, value) => {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
};

const extractYear = (text) => {
  const matches = text.match(/20\d{2}|19\d{2}/g);
  return matches ? matches[matches.length - 1] : "";
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const appendHighlightedText = (target, text, patterns) => {
  if (!text) return;

  if (!patterns.length) {
    target.append(document.createTextNode(text));
    return;
  }

  const highlightPattern = `(?:${patterns.join("|")})`;
  const splitPattern = new RegExp(`(${highlightPattern})`, "g");
  const exactPattern = new RegExp(`^${highlightPattern}$`);

  text.split(splitPattern).forEach((part) => {
    if (!part) return;
    target.append(exactPattern.test(part) ? make("strong", "", part) : document.createTextNode(part));
  });
};

const formattedCitation = (text, includeJournalHighlights) => {
  const paragraph = make("p", "citation");
  const hasMarkedAuthor = /\[\[[^\]]+\]\]/.test(text);
  const patterns = hasMarkedAuthor ? [] : ["D\\. Kim\\*?"];

  if (includeJournalHighlights) {
    patterns.push(...journalNames.map(escapeRegExp));
  }

  text.split(/(\[\[[^\]]+\]\])/g).forEach((part) => {
    const markedText = part.match(/^\[\[([^\]]+)\]\]$/);

    if (markedText) {
      paragraph.append(make("strong", "", markedText[1]));
      return;
    }

    appendHighlightedText(paragraph, part, patterns);
  });

  return paragraph;
};

const renderNotices = () => {
  const list = document.querySelector("#notice-list");
  if (!list) return;
  list.textContent = "";

  data.announcements.forEach((notice) => {
    const item = make("li");
    item.append(make("time", "", notice.date));
    item.append(make("span", "", notice.text));
    list.append(item);
  });
};

const renderStats = () => {
  const counts = {
    journals: data.publications.journals.length,
    conferences: data.publications.conferences.length,
    patents: data.publications.patents.length,
    research: data.researchAreas.length,
  };

  Object.entries(counts).forEach(([key, value]) => {
    const target = document.querySelector(`[data-count="${key}"]`);
    if (target) target.textContent = key === "research" ? String(value) : `${value}+`;
  });
};

const renderProfile = () => {
  setText("#hero-lead", data.heroLead);
  setText("#professor-name", data.professor.name);
  setText("#professor-role", data.professor.role);
  setText("#professor-korean", data.professor.korean);
  setText("#member-professor-name", data.professor.name);
  setText("#member-professor-interest", data.professor.interests);
  setText("#join-copy", data.joinText);

  const memberEmail = document.querySelector("#member-professor-email");
  if (memberEmail) {
    memberEmail.href = `mailto:${data.professor.email}`;
    memberEmail.textContent = data.professor.email;
  }

  const bio = document.querySelector("#professor-bio");
  if (bio) appendTextParagraphs(bio, data.professor.bio);

  const profile = document.querySelector("#lab-profile-list");
  if (!profile) return;
  profile.textContent = "";

  [
    ["Professor", data.professor.name],
    ["Department", "Internet of Things"],
    ["University", "Soonchunhyang University"],
    ["Email", data.professor.email],
    ["Phone", data.professor.phone],
    ["Office", data.professor.office],
  ].forEach(([term, description]) => {
    const row = make("div");
    row.append(make("dt", "", term));
    row.append(make("dd", "", description));
    profile.append(row);
  });
};

const renderResearch = () => {
  setText(
    "#research-summary",
    "The lab's research areas are organized around smart energy IoT, V2X security, smart grid security and control, and AI-driven energy applications."
  );

  const grid = document.querySelector("#research-grid");
  if (!grid) return;
  grid.textContent = "";

  data.researchAreas.forEach((area, index) => {
    const card = make("article", "research-card");
    card.append(make("span", "card-index", String(index + 1).padStart(2, "0")));
    card.append(make("h3", "", area.title));
    card.append(make("p", "", area.description));
    grid.append(card);
  });
};

const publicationGroups = () => [
  ["journals", "International Journals", data.publications.journals],
  ["conferences", "International Conferences", data.publications.conferences],
  ["patents", "Patents", data.publications.patents.map((citation) => ({ citation }))],
];

const renderPublicationItem = (item, key, category, index) => {
  const article = make("article", "publication-item");
  const yearLabel = make("time", "", extractYear(item.citation) || String(index + 1));
  const body = make("div");
  const citation = formattedCitation(item.citation, key === "journals");

  body.append(make("span", "publication-type", category));
  body.append(citation);

  if (item.url) {
    const link = make("a", "entry-link", "Open publication");
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    body.append(link);
  }

  article.append(yearLabel);
  article.append(body);
  return article;
};

const renderPublications = () => {
  const target = document.querySelector("#publication-list");
  if (!target) return;

  const query = publicationSearch?.value.trim().toLowerCase() || "";
  target.textContent = "";

  let totalVisible = 0;

  publicationGroups().forEach(([key, label, items]) => {
    if (publicationFilter !== "all" && publicationFilter !== key) return;

    const filtered = items.filter((item) => item.citation.toLowerCase().includes(query));
    if (!filtered.length) return;

    totalVisible += filtered.length;

    const section = make("section", "publication-section");
    const heading = make("div", "publication-section-heading");
    heading.append(make("h3", "", label));
    heading.append(make("span", "", `${filtered.length} items`));
    section.append(heading);

    filtered.forEach((item, index) => {
      section.append(renderPublicationItem(item, key, label, index));
    });

    target.append(section);
  });

  if (!totalVisible) {
    target.append(make("p", "empty-state", "No matching items."));
  }
};

const renderCurrentMembers = (section, people) => {
  const grid = make("div", "people-grid");
  people.forEach((person) => {
    const card = make("article", "person-card");
    card.append(make("h4", "", person.name));
    card.append(make("p", "person-meta", `${person.role}, ${person.since}`));
    if (person.email) {
      const email = make("a", "entry-link", person.email);
      email.href = `mailto:${person.email}`;
      card.append(email);
    }
    card.append(make("p", "", person.interests));
    grid.append(card);
  });
  section.append(grid);
};

const renderSimplePeople = (section, people) => {
  const list = make("ul", "compact-list");
  people.forEach((person) => {
    list.append(make("li", "", typeof person === "string" ? person : `${person.name} (${person.year})`));
  });
  section.append(list);
};

const renderGraduateAlumni = (section, people) => {
  const grid = make("div", "people-grid");
  people.forEach((person) => {
    const card = make("article", "person-card");
    card.append(make("h4", "", person.name));
    card.append(make("p", "person-meta", `${person.degree}, ${person.year}`));
    card.append(make("p", "", person.current));
    grid.append(card);
  });
  section.append(grid);
};

const renderMembers = () => {
  const groups = document.querySelector("#member-groups");
  if (!groups) return;
  groups.textContent = "";

  [
    ["Graduate Students", data.members.graduateStudents, renderCurrentMembers],
    ["Undergraduate Students", data.members.undergraduateStudents, renderSimplePeople],
    ["Graduate Alumni", data.members.graduateAlumni, renderGraduateAlumni],
    ["Undergraduate Alumni", data.members.undergraduateAlumni, renderSimplePeople],
  ].forEach(([title, people, renderer]) => {
    const section = make("article", "member-group");
    section.append(make("h3", "", title));
    renderer(section, people);
    groups.append(section);
  });
};

const renderContact = () => {
  const grid = document.querySelector("#contact-grid");
  if (!grid) return;
  grid.textContent = "";

  [
    ["Email", data.professor.email, `mailto:${data.professor.email}`],
    ["Phone", data.professor.phone, `tel:${data.professor.phone.replace(/[^+\d]/g, "")}`],
    ["Office", data.professor.office],
    ["Department", "Department of Internet of Things, Soonchunhyang University"],
  ].forEach(([title, value, href]) => {
    const block = make("div", "contact-block");
    block.append(make("h3", "", title));

    if (href) {
      const link = make("a", "", value);
      link.href = href;
      block.append(link);
    } else {
      block.append(make("p", "", value));
    }

    grid.append(block);
  });
};

const wireNavigation = () => {
  if (year) year.textContent = new Date().getFullYear();

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const isOpen = body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      body.classList.remove("nav-open");
      navToggle?.setAttribute("aria-expanded", "false");
    });
  });

  const sections = [...document.querySelectorAll("main section[id]")];
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          navLinks.forEach((link) => {
            const isActive = link.getAttribute("href") === `#${entry.target.id}`;
            link.classList.toggle("active", isActive);
          });
        });
      },
      {
        rootMargin: "-35% 0px -55% 0px",
        threshold: 0,
      }
    );

    sections.forEach((section) => observer.observe(section));
  }
};

const wirePublicationControls = () => {
  publicationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      publicationFilter = button.dataset.pubFilter;
      publicationButtons.forEach((item) => item.classList.toggle("active", item === button));
      renderPublications();
    });
  });

  publicationSearch?.addEventListener("input", renderPublications);
};

renderNotices();
renderStats();
renderProfile();
renderResearch();
renderPublications();
renderMembers();
renderContact();
wireNavigation();
wirePublicationControls();
