const $ = (selector) => document.querySelector(selector);
const activities = [
  "Spin Wheel",
  "Quick Quiz",
  "App Demo",
  "Photo Wall",
  "Scan & Discover",
  "Feedback Wall",
];
const key = "bida-hk-demo-v1";
function records() {
  return JSON.parse(sessionStorage.getItem(key) || "[]");
}
function element(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}
for (const activity of activities) {
  const label = element("label", "");
  const check = document.createElement("input");
  check.type = "checkbox";
  check.value = activity;
  label.append(check, activity);
  $("#choices").append(label);
}
function modal(title, message) {
  $("#title").textContent = title;
  $("#body").textContent = message;
  $("dialog").setAttribute("aria-labelledby", "title");
  $("dialog").showModal();
}
$("#close").onclick = () => $("dialog").close();
document
  .querySelectorAll("[data-store]")
  .forEach(
    (button) =>
      (button.onclick = () =>
        modal(
          button.dataset.store,
          "Preview only. The verified BIDA store listing will open here at launch.",
        )),
  );
$("form").onsubmit = (event) => {
  event.preventDefault();
  const name = $("#visitor").value.trim();
  if (!name) {
    $("#status").textContent = "Enter a full name to continue.";
    $("#visitor").focus();
    return;
  }
  $("#submit").disabled = true;
  try {
    const list = records();
    let code;
    do {
      code =
        "DEMO-" +
        crypto
          .getRandomValues(new Uint32Array(1))[0]
          .toString(36)
          .toUpperCase();
    } while (list.some((row) => row.code === code));
    list.push({
      name,
      code,
      interests: [...document.querySelectorAll("#choices :checked")].map(
        (x) => x.value,
      ),
      checked: [],
      created: new Date().toISOString(),
    });
    sessionStorage.setItem(key, JSON.stringify(list));
    location.assign("registered.html#" + code);
  } catch {
    $("#status").textContent =
      "Could not save in this browser. Enable session storage and try again.";
  } finally {
    $("#submit").disabled = false;
  }
};
new IntersectionObserver(([entry]) => {
  $("nav").hidden = entry.isIntersecting;
}).observe($(".stores"));
