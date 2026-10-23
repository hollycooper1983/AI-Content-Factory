import { NextResponse, type NextRequest } from "next/server";

// Fast first line of defense: send signed-out visitors on member-only pages to the login page.
// Every page and action still verifies the session and permissions on the server.
const PROTECTED = ["/feed", "/profile", "/network", "/groups", "/messages", "/notifications", "/dashboard", "/my-colleges", "/applications", "/financial-aid", "/fafsa", "/my-scholarships", "/my-jobs", "/resume-builder", "/career-planner", "/transfer-planner", "/calendar", "/settings", "/saved", "/organization/", "/admin"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  // Member profile pages (/profile/[id]) handle their own visibility rules, including for guests.
  if (/^\/profile\/[^/]+$/.test(pathname) && !["/profile/edit", "/profile/preview"].includes(pathname)) return NextResponse.next();
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(p.endsWith("/") ? p : p + "/")) && !req.cookies.get("ns_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next|api|favicon|robots.txt|sitemap.xml).*)"] };
