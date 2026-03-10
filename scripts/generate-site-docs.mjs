import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(projectRoot, "..");
const docsDir = path.join(projectRoot, "docs", "site");
const codeExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

const exactDescriptions = {
  "app/layout.tsx":
    "Root shell that sets Hebrew RTL rendering, metadata, theme hydration, and global providers.",
  "app/page.tsx":
    "Homepage that anchors question discovery and acts as the main landing surface.",
  "app/questions/page.tsx":
    "Question index with search, sort, filters, and question-creation entry points.",
  "app/questions/[id]/page.tsx":
    "Question detail page with answers, votes, reports, and moderation actions.",
  "app/status/page.tsx":
    "Status feed for short-form posting, starring, sharing, and replies.",
  "app/profile/page.tsx":
    "Private profile page for the signed-in user.",
  "app/profile/[username]/page.tsx":
    "Public profile page with comments, likes, and chat initiation.",
  "app/chat/page.tsx":
    "Chat inbox for requests and conversation lists.",
  "app/chat/[conversationId]/page.tsx":
    "Conversation screen for realtime chat, read state, blocking, and reporting.",
  "app/notifications/page.tsx":
    "Notification inbox and unread-state hub.",
  "app/admin/page.tsx":
    "Primary admin dashboard for approvals, moderation, and user oversight.",
  "app/admin/permissions/page.tsx":
    "Admin policy and permissions configuration surface.",
  "app/components/AuthProvider.tsx":
    "Central auth context for session hydration, profile loading, permissions, and login gating.",
  "app/components/NewQuestionModal.tsx":
    "Question composer modal with tag validation and suggestion support.",
  "app/components/AdminDashboard.tsx":
    "Main admin control center rendered inside the admin page.",
  "app/components/AuthModal.tsx":
    "Shared modal shell for switching between login and registration flows.",
  "app/components/HebrewRegistration.tsx":
    "Custom multi-step Hebrew registration flow with phone verification and application submission.",
  "app/components/LoginModal.tsx":
    "Modal login form integrated into the main app shell.",
  "app/components/RegisterModal.tsx":
    "Modal registration entry point for the main app shell.",
  "app/components/RoleBadge.tsx":
    "Reusable role-label component for profile cards and moderation UI.",
  "app/components/UserAvatar.tsx":
    "Reusable avatar component for user identity displays.",
  "app/components/UserManagementModal.tsx":
    "Admin modal for role changes, suspensions, and reputation actions.",
  "app/components/AuthStatusDisplay.tsx":
    "Compact component for presenting current auth or approval state.",
  "app/components/SimpleThemeToggle.tsx":
    "Compact theme-mode toggle.",
  "app/components/ClientWrapper.tsx":
    "Client-only wrapper for browser-dependent rendering.",
  "app/components/NotesClient.tsx":
    "Starter/demo notes client retained from the original scaffold.",
  "app/components/NavHeader.tsx":
    "Main app header and navigation chrome.",
  "app/components/Drawer.tsx":
    "Navigation drawer for mobile or condensed navigation states.",
  "app/components/ThemeProvider.tsx":
    "Client theme provider and persistence wrapper.",
  "app/components/useForcedAuthModal.ts":
    "Hook for forcing authentication UI when an action requires login.",
  "app/hooks/useNotificationsRealtime.ts":
    "Realtime hook for notification unread count and payload updates.",
  "app/hooks/usePresenceTick.ts":
    "Presence heartbeat hook for active-user tracking.",
  "app/lib/theme-service.ts":
    "Theme preference loader and persistence helper.",
  "app/utils/timeGreeting.ts":
    "Utility that maps the current time to a greeting string.",
  "lib/tag-matching.ts":
    "Hebrew-aware tag normalization, fuzzy matching, and scoring engine.",
  "lib/ai/embeddings.ts":
    "Embedding helpers used by the semantic tag-suggestion pipeline.",
  "lib/notifications.ts":
    "Service-role helper for cross-user notification inserts.",
  "lib/permissionKeys.ts":
    "Canonical permission key vocabulary.",
  "lib/permissions.ts":
    "Permission lookup helpers and auth-integration glue.",
  "lib/supabase/client.ts":
    "Browser Supabase client factory.",
  "lib/supabase/server.ts":
    "Server Supabase client factory bound to request cookies.",
  "lib/supabase/admin.ts":
    "Service-role Supabase client factory for privileged operations.",
  "lib/supabase/middleware.ts":
    "Middleware helper for auth refresh and request gating.",
  "lib/twilio.ts":
    "Twilio wrapper for SMS verification flows.",
  "lib/tag-suggestions/embedding-sync.ts":
    "Sync helpers that persist question and tag embeddings into Supabase tables.",
  "lib/tag-suggestions/hybrid-ranker.ts":
    "Ranking helpers that merge lexical and semantic tag candidates.",
  "lib/tag-suggestions/source-text.ts":
    "Source-text builders for embedding generation.",
  "lib/tag-suggestions/supabase-search.ts":
    "Supabase-backed search helpers for semantic and autocomplete tag retrieval.",
  "scripts/generate-site-docs.mjs":
    "Documentation generator that scans the codebase and writes the site handbook.",
};

const workflowSections = [
  {
    title: "Auth and onboarding",
    summary:
      "Login is handled in the app shell, while registration is a custom multi-step flow with availability checks, phone verification, account creation, and admin approval.",
    files: [
      "app/components/AuthProvider.tsx",
      "app/components/HebrewRegistration.tsx",
      "app/components/LoginModal.tsx",
      "app/components/RegisterModal.tsx",
      "app/api/auth/register/route.ts",
      "app/api/auth/send-verification/route.ts",
      "app/api/auth/verify-phone/route.ts",
      "app/api/auth/submit-application/route.ts",
      "app/api/admin/approve-user/route.ts",
    ],
  },
  {
    title: "Questions and answers",
    summary:
      "Questions are discovered on the home and question-index routes, created through a modal workflow, and managed in detail pages that support answers, voting, reporting, and removal requests.",
    files: [
      "app/page.tsx",
      "app/questions/page.tsx",
      "app/questions/[id]/page.tsx",
      "app/components/NewQuestionModal.tsx",
      "app/api/questions/route.ts",
      "app/api/questions/[id]/answers/route.ts",
      "app/api/questions/[id]/vote/route.ts",
      "app/api/questions/[id]/request-removal/route.ts",
      "lib/tag-matching.ts",
    ],
  },
  {
    title: "Statuses, profiles, and notifications",
    summary:
      "The app has a lighter-weight status feed, public and private profile views, and a notification layer that connects activity across features.",
    files: [
      "app/status/page.tsx",
      "app/profile/page.tsx",
      "app/profile/[username]/page.tsx",
      "app/notifications/page.tsx",
      "app/hooks/useNotificationsRealtime.ts",
      "app/api/status/route.ts",
      "app/api/profile/[username]/route.ts",
      "app/api/notifications/route.ts",
      "lib/notifications.ts",
    ],
  },
  {
    title: "Chat, moderation, and admin",
    summary:
      "Chat is request-based and tied into blocking, reporting, unread state, and presence. Admin flows span approvals, moderation queues, permission management, and appeals.",
    files: [
      "app/chat/page.tsx",
      "app/chat/[conversationId]/page.tsx",
      "app/admin/page.tsx",
      "app/admin/permissions/page.tsx",
      "app/components/AdminDashboard.tsx",
      "app/api/chat/request/route.ts",
      "app/api/chat/conversations/[id]/messages/route.ts",
      "app/api/report/content/route.ts",
      "app/api/admin/question-deletion-appeals/[id]/decision/route.ts",
    ],
  },
];

async function main() {
  const appFiles = await collectFiles(path.join(projectRoot, "app"));
  const componentFiles = await collectFiles(path.join(projectRoot, "components"));
  const libFiles = await collectFiles(path.join(projectRoot, "lib"));
  const scriptFiles = await collectFiles(path.join(projectRoot, "scripts"));
  const migrationFiles = await collectFiles(path.join(repoRoot, "supabase", "migrations"), new Set([".sql"]));

  const appEntries = await Promise.all(appFiles.map((file) => analyzeCodeFile(file, projectRoot)));
  const componentEntries = await Promise.all(componentFiles.map((file) => analyzeCodeFile(file, projectRoot)));
  const libEntries = await Promise.all(libFiles.map((file) => analyzeCodeFile(file, projectRoot)));
  const scriptEntries = await Promise.all(scriptFiles.map((file) => analyzeCodeFile(file, projectRoot)));
  const migrationEntries = await Promise.all(
    migrationFiles.map((file) => analyzeSqlFile(file, repoRoot)),
  );

  const layouts = appEntries
    .filter((entry) => /(^|\/)layout\.tsx$/.test(entry.relPath))
    .map((entry) => withRoute(entry, "layout"));
  const pages = appEntries
    .filter((entry) => /(^|\/)page\.tsx$/.test(entry.relPath))
    .map((entry) => withRoute(entry, "page"));
  const appRouteHandlers = appEntries
    .filter((entry) => /(^|\/)route\.ts$/.test(entry.relPath) && !entry.relPath.startsWith("app/api/"))
    .map((entry) => withRoute(entry, "route"));
  const apiEntries = appEntries
    .filter((entry) => entry.relPath.startsWith("app/api/") && /(^|\/)route\.ts$/.test(entry.relPath))
    .map((entry) => withApi(entry));
  const appComponents = appEntries.filter((entry) => entry.relPath.startsWith("app/components/"));
  const hooks = appEntries.filter((entry) => entry.relPath.startsWith("app/hooks/"));
  const appSupport = appEntries.filter(
    (entry) => entry.relPath.startsWith("app/lib/") || entry.relPath.startsWith("app/utils/"),
  );

  const sqlInventory = buildSqlInventory(migrationEntries);

  await fs.mkdir(docsDir, { recursive: true });

  await writeDoc("README.md", renderIndex({
    layouts,
    pages,
    appRouteHandlers,
    apiEntries,
    appComponents,
    hooks,
    componentEntries,
    libEntries,
    scriptEntries,
    migrationEntries,
    sqlInventory,
  }));
  await writeDoc("ARCHITECTURE.md", renderArchitecture({ pages, apiEntries, sqlInventory }));
  await writeDoc("WORKFLOWS.md", renderWorkflows());
  await writeDoc("PAGES_AND_LAYOUTS.md", renderPages(layouts, pages, appRouteHandlers));
  await writeDoc("API_REFERENCE.md", renderApi(apiEntries));
  await writeDoc(
    "COMPONENTS_AND_HOOKS.md",
    renderCodeInventories("Components and Hooks", [
      { title: "App components", entries: appComponents },
      { title: "Hooks", entries: hooks },
      { title: "Starter and shared components", entries: componentEntries },
    ]),
  );
  await writeDoc(
    "LIBRARIES_AND_SERVICES.md",
    renderCodeInventories("Libraries and Services", [
      { title: "Shared libraries", entries: libEntries },
      { title: "App support modules", entries: appSupport },
      { title: "Scripts", entries: scriptEntries },
    ]),
  );
  await writeDoc("DATA_MODEL.md", renderDataModel(sqlInventory, migrationEntries));

  process.stdout.write("Generated docs/site handbook.\n");
}

async function collectFiles(targetDir, extensions = codeExtensions) {
  const results = [];

  async function walk(currentDir) {
    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const absPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "docs") {
          continue;
        }
        await walk(absPath);
        continue;
      }
      if (extensions.has(path.extname(entry.name))) {
        results.push(absPath);
      }
    }
  }

  await walk(targetDir);
  return results.sort();
}

async function analyzeCodeFile(absPath, baseRoot) {
  const content = await fs.readFile(absPath, "utf8");
  return {
    relPath: toPosix(path.relative(baseRoot, absPath)),
    lineCount: content.split(/\r?\n/).length,
    isClient: /^\s*["']use client["'];?/m.test(content),
    exports: unique([
      ...extractMatches(content, /^\s*export\s+default\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/gm),
      ...extractMatches(
        content,
        /^\s*export\s+default\s+(?!async\s+function\b)(?!function\b)([A-Za-z0-9_]+)\s*;?/gm,
      ),
      ...extractMatches(content, /^\s*export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/gm),
      ...extractMatches(content, /^\s*export\s+(?:const|let|var|class|type|interface|enum)\s+([A-Za-z0-9_]+)/gm),
    ]),
    functions: unique([
      ...extractMatches(content, /^\s*(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(/gm),
      ...extractMatches(
        content,
        /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?(?:<[^>]+>\s*)?(?:\([^=]*\)|[A-Za-z0-9_]+)\s*(?::\s*[^=]+)?=>/gm,
      ),
      ...extractMatches(
        content,
        /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:React\.)?useCallback\s*\(/gm,
      ),
      ...extractMatches(
        content,
        /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?function\b/gm,
      ),
    ]),
    routeHandlers: extractMatches(
      content,
      /^\s*export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/gm,
    ),
    fetchTargets: extractMatches(content, /fetch\(\s*['"`]([^'"`$]+)['"`]/g),
    tables: extractMatches(content, /\.from\(\s*['"`]([^'"`]+)['"`]\s*\)/g),
    rpcs: extractMatches(content, /\.rpc\(\s*['"`]([^'"`]+)['"`]\s*\)/g),
  };
}

async function analyzeSqlFile(absPath, baseRoot) {
  const content = await fs.readFile(absPath, "utf8");
  return {
    relPath: toPosix(path.relative(baseRoot, absPath)),
    tables: extractMatches(
      content,
      /create\s+table(?:\s+if\s+not\s+exists)?\s+(?:public\.)?"?([a-zA-Z0-9_]+)"?/gi,
    ),
    views: extractMatches(
      content,
      /create(?:\s+or\s+replace)?\s+view\s+(?:public\.)?"?([a-zA-Z0-9_]+)"?/gi,
    ),
    functions: extractMatches(
      content,
      /create(?:\s+or\s+replace)?\s+function\s+(?:public\.)?"?([a-zA-Z0-9_]+)"?/gi,
    ),
    triggers: extractMatches(content, /create\s+trigger\s+"?([a-zA-Z0-9_]+)"?/gi),
  };
}

function withRoute(entry, kind) {
  const routePath = relPathToRoute(entry.relPath);
  return {
    ...entry,
    kind,
    routePath,
    surface: classifyPageSurface(routePath),
    description: describe(entry.relPath, kind, routePath),
  };
}

function withApi(entry) {
  const endpoint = relPathToApi(entry.relPath);
  return {
    ...entry,
    endpoint,
    domain: classifyApiDomain(endpoint),
    description: describeApi(endpoint),
  };
}

function buildSqlInventory(migrations) {
  const tables = new Set();
  const views = new Set();
  const functions = new Set();
  const triggers = new Set();
  for (const migration of migrations) {
    migration.tables.forEach((item) => tables.add(item));
    migration.views.forEach((item) => views.add(item));
    migration.functions.forEach((item) => functions.add(item));
    migration.triggers.filter((item) => item !== "function").forEach((item) => triggers.add(item));
  }
  return {
    tables: [...tables].sort(),
    views: [...views].sort(),
    functions: [...functions].sort(),
    triggers: [...triggers].sort(),
  };
}

function renderIndex({
  layouts,
  pages,
  appRouteHandlers,
  apiEntries,
  appComponents,
  hooks,
  componentEntries,
  libEntries,
  scriptEntries,
  migrationEntries,
  sqlInventory,
}) {
  return [
    "# Qsite Site Documentation",
    "",
    "This documentation set is auto-generated from the codebase and organized to make the app easy to audit by route, feature, and supporting module.",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Navigation",
    "",
    "- [Architecture](./ARCHITECTURE.md)",
    "- [Workflows](./WORKFLOWS.md)",
    "- [Pages and layouts](./PAGES_AND_LAYOUTS.md)",
    "- [API reference](./API_REFERENCE.md)",
    "- [Components and hooks](./COMPONENTS_AND_HOOKS.md)",
    "- [Libraries and services](./LIBRARIES_AND_SERVICES.md)",
    "- [Data model](./DATA_MODEL.md)",
    "",
    "## Snapshot",
    "",
    "- Stack: Next.js App Router, React, TypeScript, Tailwind, Supabase, Twilio, Resend.",
    "- Product areas: Q&A, statuses, profiles, chat, notifications, moderation, and admin policy tooling.",
    "- UI direction: Hebrew + RTL.",
    "- Important note: the repo still contains Supabase starter-kit remnants alongside the custom product.",
    "",
    "## Coverage counts",
    "",
    "| Area | Count |",
    "| --- | ---: |",
    `| Layout files | ${layouts.length} |`,
    `| Page files | ${pages.length} |`,
    `| Non-API route handlers | ${appRouteHandlers.length} |`,
    `| API route files | ${apiEntries.length} |`,
    `| App components | ${appComponents.length} |`,
    `| Hooks | ${hooks.length} |`,
    `| Shared or starter components | ${componentEntries.length} |`,
    `| Library files | ${libEntries.length} |`,
    `| Script files | ${scriptEntries.length} |`,
    `| Migrations | ${migrationEntries.length} |`,
    `| Tables discovered in migrations | ${sqlInventory.tables.length} |`,
    `| SQL functions discovered in migrations | ${sqlInventory.functions.length} |`,
    "",
    "## Maintenance",
    "",
    "- Refresh the generated handbook with `npm run docs:generate` from `my-app`.",
    "- Use the trigger word `docUpdate` in future code-change requests whenever the documentation must be refreshed as part of the task.",
    "",
  ].join("\n");
}

function renderArchitecture({ pages, apiEntries, sqlInventory }) {
  const corePages = pages.filter((page) => page.surface === "Core product").length;
  const adminPages = pages.filter((page) => page.surface === "Admin and moderation").length;
  const authPages = pages.filter((page) => page.surface === "Auth and onboarding").length;
  return [
    "# Architecture",
    "",
    "[Back to index](./README.md)",
    "",
    "## App shell",
    "",
    "- `app/layout.tsx` is the canonical root shell.",
    "- The app uses RTL Hebrew defaults and client-side theme hydration.",
    "- `AuthProvider` is the core session/profile/permission state container.",
    "",
    "## Product surface",
    "",
    `- Core product pages: ${corePages}`,
    `- Auth and onboarding pages: ${authPages}`,
    `- Admin and moderation pages: ${adminPages}`,
    `- API route files: ${apiEntries.length}`,
    `- Database tables discovered from migrations: ${sqlInventory.tables.length}`,
    "",
    "## Data flow",
    "",
    "- Most features follow: page/component -> `/api/*` route handler -> Supabase query or SQL RPC.",
    "- Some client-only flows talk to Supabase directly for session, profile, or preference work.",
    "- Notifications and other cross-user writes rely on service-role access in controlled helper modules.",
    "",
    "## Important architectural traits",
    "",
    "- Login approval, reputation blocking, and admin permissions add a second authorization layer beyond basic auth.",
    "- The database is part of the business-logic surface, not just persistence.",
    "- The codebase mixes custom product code with a smaller amount of original Supabase starter scaffolding.",
    "",
  ].join("\n");
}

function renderWorkflows() {
  return [
    "# Workflows",
    "",
    "[Back to index](./README.md)",
    "",
    ...workflowSections.flatMap((section) => [
      `## ${section.title}`,
      "",
      section.summary,
      "",
      "Key files:",
      ...section.files.map((file) => `- \`${file}\``),
      "",
    ]),
  ].join("\n");
}

function renderPages(layouts, pages, appRouteHandlers) {
  const sections = groupBy(pages, (page) => page.surface);
  const order = [
    "Core product",
    "Auth and onboarding",
    "Admin and moderation",
    "Account and settings",
    "Placeholder",
    "Starter or legacy",
  ];
  return [
    "# Pages and Layouts",
    "",
    "[Back to index](./README.md)",
    "",
    "## Layouts",
    "",
    ...layouts.flatMap((entry) => renderRouteBlock(entry)),
    "",
    ...order.flatMap((surface) => {
      const entries = sections.get(surface) || [];
      if (!entries.length) return [];
      return [`## ${surface}`, "", ...entries.flatMap((entry) => renderRouteBlock(entry)), ""];
    }),
    "## Non-API route handlers",
    "",
    ...(appRouteHandlers.length
      ? appRouteHandlers.flatMap((entry) => renderRouteBlock(entry))
      : ["No non-API route handlers found.", ""]),
  ].join("\n");
}

function renderApi(apiEntries) {
  const sections = groupBy(apiEntries, (entry) => entry.domain);
  const order = [
    "Questions and tags",
    "Profiles and social",
    "Chat and presence",
    "Statuses and notifications",
    "Auth and onboarding",
    "Permissions and admin",
    "Moderation and appeals",
    "Operations and setup",
    "Other",
  ];
  return [
    "# API Reference",
    "",
    "[Back to index](./README.md)",
    "",
    ...order.flatMap((domain) => {
      const entries = sections.get(domain) || [];
      if (!entries.length) return [];
      return [`## ${domain}`, "", ...entries.flatMap((entry) => renderApiBlock(entry)), ""];
    }),
  ].join("\n");
}

function renderCodeInventories(title, sections) {
  return [
    `# ${title}`,
    "",
    "[Back to index](./README.md)",
    "",
    ...sections.flatMap((section) => [
      `## ${section.title}`,
      "",
      ...section.entries
        .sort((a, b) => a.relPath.localeCompare(b.relPath))
        .flatMap((entry) => renderCodeBlock(entry)),
      "",
    ]),
  ].join("\n");
}

function renderDataModel(sqlInventory, migrations) {
  return [
    "# Data Model",
    "",
    "[Back to index](./README.md)",
    "",
    "The migration directory is the current source of truth for database structure and DB-side business logic.",
    "",
    "## Inventory counts",
    "",
    `- Tables: ${sqlInventory.tables.length}`,
    `- Views: ${sqlInventory.views.length}`,
    `- SQL functions: ${sqlInventory.functions.length}`,
    `- Triggers: ${sqlInventory.triggers.length}`,
    "",
    "## Tables",
    "",
    ...sqlInventory.tables.map((name) => `- \`${name}\``),
    "",
    "## Views",
    "",
    ...(sqlInventory.views.length ? sqlInventory.views.map((name) => `- \`${name}\``) : ["- None discovered"]),
    "",
    "## SQL functions",
    "",
    ...sqlInventory.functions.map((name) => `- \`${name}\``),
    "",
    "## Triggers",
    "",
    ...(sqlInventory.triggers.length
      ? sqlInventory.triggers.map((name) => `- \`${name}\``)
      : ["- None discovered"]),
    "",
    "## Migration timeline",
    "",
    ...migrations
      .sort((a, b) => a.relPath.localeCompare(b.relPath))
      .flatMap((migration) => [
        `### \`${migration.relPath}\``,
        `- Tables added or changed in file: ${formatInlineList(migration.tables)}`,
        `- Views added or changed in file: ${formatInlineList(migration.views)}`,
        `- SQL functions added or changed in file: ${formatInlineList(migration.functions)}`,
        `- Triggers added or changed in file: ${formatInlineList(migration.triggers)}`,
        "",
      ]),
  ].join("\n");
}

function renderRouteBlock(entry) {
  return [
    `### \`${entry.relPath}\``,
    `- Route: \`${entry.routePath}\``,
    `- Kind: ${entry.kind}`,
    `- Surface: ${entry.surface}`,
    `- Runtime: ${entry.isClient ? "client" : "server"}`,
    `- Description: ${entry.description}`,
    `- Exports: ${formatInlineList(entry.exports)}`,
    `- Named functions: ${formatInlineList(entry.functions)}`,
    `- Fetch calls: ${formatInlineList(entry.fetchTargets)}`,
    `- Supabase tables/views: ${formatInlineList(entry.tables)}`,
    `- Supabase RPCs: ${formatInlineList(entry.rpcs)}`,
    "",
  ];
}

function renderApiBlock(entry) {
  return [
    `### \`${entry.relPath}\``,
    `- Endpoint: \`${entry.endpoint}\``,
    `- Domain: ${entry.domain}`,
    `- Methods: ${formatInlineList(entry.routeHandlers)}`,
    `- Description: ${entry.description}`,
    `- Named functions: ${formatInlineList(entry.functions)}`,
    `- Fetch calls: ${formatInlineList(entry.fetchTargets)}`,
    `- Supabase tables/views: ${formatInlineList(entry.tables)}`,
    `- Supabase RPCs: ${formatInlineList(entry.rpcs)}`,
    "",
  ];
}

function renderCodeBlock(entry) {
  return [
    `### \`${entry.relPath}\``,
    `- Runtime: ${entry.isClient ? "client" : "shared/server"}`,
    `- Description: ${describe(entry.relPath, "code")}`,
    `- Exports: ${formatInlineList(entry.exports)}`,
    `- Named functions: ${formatInlineList(entry.functions)}`,
    `- Fetch calls: ${formatInlineList(entry.fetchTargets)}`,
    `- Supabase tables/views: ${formatInlineList(entry.tables)}`,
    `- Supabase RPCs: ${formatInlineList(entry.rpcs)}`,
    "",
  ];
}

function describe(relPath, kind, target = "") {
  if (exactDescriptions[relPath]) return exactDescriptions[relPath];
  if (kind === "layout") return `Layout wrapper for \`${target}\`.`;
  if (kind === "page") return `Page implementation for \`${target}\`.`;
  if (kind === "route") return `Route handler for \`${target}\`.`;
  const base = path.basename(relPath, path.extname(relPath));
  if (relPath.startsWith("app/components/")) return `Reusable app component for ${humanize(base)}.`;
  if (relPath.startsWith("app/hooks/")) return `Custom hook for ${humanize(base)}.`;
  if (relPath.startsWith("app/lib/") || relPath.startsWith("app/utils/")) {
    return `App-only support module for ${humanize(base)}.`;
  }
  if (relPath.startsWith("components/ui/")) return `Shared UI primitive for ${humanize(base)}.`;
  if (relPath.startsWith("components/tutorial/")) return `Starter tutorial helper for ${humanize(base)}.`;
  if (relPath.startsWith("components/")) return `Starter/shared component for ${humanize(base)}.`;
  if (relPath.startsWith("lib/tag-suggestions/")) {
    return `Tag-suggestion support module for ${humanize(base)}.`;
  }
  if (relPath.startsWith("lib/ai/")) return `AI integration helper for ${humanize(base)}.`;
  return `Supporting ${kind} file for ${humanize(base)}.`;
}

function describeApi(endpoint) {
  if (endpoint === "/api/questions") {
    return "Lists questions and creates new questions.";
  }
  if (endpoint === "/api/questions/suggest-tags") {
    return "Scores a question draft and returns suggested tags.";
  }
  if (/\/api\/questions\/\[id\]$/.test(endpoint)) {
    return "Fetches or updates a single question.";
  }
  if (/\/api\/questions\/\[id\]\/answers$/.test(endpoint)) {
    return "Lists or creates answers for a question.";
  }
  if (/\/api\/questions\/\[id\]\/vote$/.test(endpoint)) {
    return "Creates or updates a question vote.";
  }
  if (/\/api\/questions\/\[id\]\/answers\/\[answerId\]\/vote$/.test(endpoint)) {
    return "Creates or updates an answer vote.";
  }
  if (/\/api\/questions\/\[id\]\/request-removal$/.test(endpoint)) {
    return "Submits a question-removal request.";
  }
  if (endpoint.startsWith("/api/profile/")) {
    return "Fetches or mutates profile-related public or private social data.";
  }
  if (endpoint.startsWith("/api/chat/")) {
    return "Handles chat requests, conversations, read state, blocks, or messages.";
  }
  if (endpoint.startsWith("/api/status/")) {
    return "Handles status feed reads, writes, replies, stars, or shares.";
  }
  if (endpoint.startsWith("/api/notifications")) {
    return "Reads notifications, unread counts, or mark-read actions.";
  }
  if (endpoint.startsWith("/api/auth/")) {
    return "Handles custom registration, verification, or onboarding steps.";
  }
  if (endpoint.startsWith("/api/admin/") || endpoint.startsWith("/api/permissions/")) {
    return "Handles admin policy, user management, permissions, or moderation actions.";
  }
  if (endpoint.startsWith("/api/report/") || endpoint.startsWith("/api/appeals/")) {
    return "Handles reporting, removal requests, or appeal workflows.";
  }
  if (endpoint.startsWith("/api/cron/") || endpoint.startsWith("/api/setup/") || endpoint.startsWith("/api/stats/")) {
    return "Operational or setup endpoint.";
  }
  return `Route handler for \`${endpoint}\`.`;
}

function relPathToRoute(relPath) {
  let route = relPath.replace(/^app\//, "");
  route = route.replace(/(^|\/)(page|layout)\.tsx$/, "");
  route = route.replace(/\/route\.ts$/, "");
  if (route === "") return "/";
  return `/${route}`;
}

function relPathToApi(relPath) {
  return `/${relPath.replace(/^app\//, "").replace(/\/route\.ts$/, "")}`;
}

function classifyPageSurface(routePath) {
  if (routePath.startsWith("/admin")) return "Admin and moderation";
  if (routePath.startsWith("/auth")) return "Auth and onboarding";
  if (routePath.startsWith("/settings") || routePath.startsWith("/account") || routePath.startsWith("/appeal")) {
    return "Account and settings";
  }
  if (routePath === "/stories" || routePath === "/discussions") return "Placeholder";
  if (routePath.startsWith("/protected")) return "Starter or legacy";
  return "Core product";
}

function classifyApiDomain(endpoint) {
  if (endpoint.startsWith("/api/questions") || endpoint === "/api/tags") return "Questions and tags";
  if (endpoint.startsWith("/api/profile")) return "Profiles and social";
  if (endpoint.startsWith("/api/chat") || endpoint.startsWith("/api/presence") || endpoint.startsWith("/api/me")) {
    return "Chat and presence";
  }
  if (endpoint.startsWith("/api/status") || endpoint.startsWith("/api/notifications")) {
    return "Statuses and notifications";
  }
  if (endpoint.startsWith("/api/auth")) return "Auth and onboarding";
  if (endpoint.startsWith("/api/admin") || endpoint.startsWith("/api/permissions")) {
    return "Permissions and admin";
  }
  if (endpoint.startsWith("/api/report") || endpoint.startsWith("/api/appeals")) {
    return "Moderation and appeals";
  }
  if (endpoint.startsWith("/api/cron") || endpoint.startsWith("/api/setup") || endpoint.startsWith("/api/stats")) {
    return "Operations and setup";
  }
  return "Other";
}

function extractMatches(content, pattern) {
  const values = new Set();
  for (const match of content.matchAll(pattern)) {
    if (match[1]) values.add(match[1].trim());
  }
  return [...values];
}

function unique(items) {
  return [...new Set(items.filter((item) => item && item !== "function"))].sort();
}

function groupBy(items, getKey) {
  const map = new Map();
  for (const item of items) {
    const key = getKey(item);
    const existing = map.get(key) || [];
    existing.push(item);
    map.set(key, existing);
  }
  return map;
}

function humanize(value) {
  return value
    .replace(/\[(.+?)\]/g, "$1")
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase();
}

function formatInlineList(items) {
  const filtered = (items || []).filter((item) => item && item !== "function");
  return filtered.length ? filtered.map((item) => `\`${item}\``).join(", ") : "None";
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

async function writeDoc(fileName, content) {
  await fs.writeFile(path.join(docsDir, fileName), content, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
