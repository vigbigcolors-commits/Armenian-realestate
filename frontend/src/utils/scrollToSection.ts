export function scrollToSection(id: string, behavior: ScrollBehavior = "smooth"): void {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior, block: "start" });
  }
}
