

const header = document.getElementById("header");
const onScroll = () => {
  if (window.scrollY > 30) header.classList.add("scrolled");
  else header.classList.remove("scrolled");
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const navToggle = document.getElementById("navToggle");
const navMobile = document.getElementById("navMobile");
navToggle.addEventListener("click", () => {
  const isOpen = !navMobile.hidden;
  navMobile.hidden = isOpen;
  navToggle.setAttribute("aria-expanded", String(!isOpen));
});
navMobile.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => {
    navMobile.hidden = true;
    navToggle.setAttribute("aria-expanded", "false");
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
);
document.querySelectorAll(".reveal-on-scroll").forEach((el) => observer.observe(el));

