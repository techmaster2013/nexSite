const $ = selector => document.querySelector(selector);

let controller = null;
let frame = null;
let ready = false;
let starting = null;
let lastUrl = "";

const base = new URL("./", location.href).pathname;
const home = $("#home");
const browserPage = $("#browserPage");
const view = $("#browserView");
const pageView = $("#pageView");
const status = $("#status");
const pageStatus = $("#pageStatus");
const url = $("#url");
const pageUrl = $("#pageUrl");

function normalize(value) {
  let target = value.trim();
  if (!target) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(target)) {
    target = "https://www.google.com/search?q=" + encodeURIComponent(target);
  }
  return target;
}

function setStatus(message) {
  status.textContent = message;
  pageStatus.textContent = message;
}

async function startScramjet() {
  if (ready) return true;
  if (starting) return starting;

  starting = (async () => {
    try {
      if (!("serviceWorker" in navigator)) {
        throw new Error("Service workers are unavailable");
      }

      await navigator.serviceWorker.register("./sw.js?v=3", { scope: base });

      const registration = await navigator.serviceWorker.ready;

      if (!navigator.serviceWorker.controller) {
        await new Promise(resolve => {
          navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
        });
      }

      const serviceWorker = navigator.serviceWorker.controller || registration.active;
      if (!serviceWorker) throw new Error("Scramjet service worker is not active");

      const Controller = globalThis.$scramjetController?.Controller;
      if (!Controller) throw new Error("Scramjet controller API did not load");

      const { default: LibcurlClient } = await import("./libcurl/index.mjs");
      const transport = new LibcurlClient({ wisp: "wss://wisp.mercurywork.shop/" });
      await transport.init?.();

      controller = new Controller({
        serviceworker: serviceWorker,
        transport,
        config: {
          prefix: base + "~/sj/",
          scramjetPath: "./scramjet/scramjet.js",
          injectPath: "./controller/controller.inject.js",
          wasmPath: "./scramjet/scramjet.wasm"
        }
      });

      await controller.wait();
      ready = true;
      setStatus("Scramjet 2 ready");
      return true;
    } catch (error) {
      console.error("[nexSite] Scramjet startup failed", error);
      setStatus("Scramjet failed: " + (error?.message || String(error)));
      return false;
    } finally {
      starting = null;
    }
  })();

  return starting;
}

function showBrowserPage() {
  home.hidden = true;
  browserPage.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showHome() {
  browserPage.hidden = true;
  home.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function navigate(rawValue) {
  const target = normalize(rawValue);
  if (!target) return;

  url.value = target;
  pageUrl.value = target;
  showBrowserPage();

  if (!(await startScramjet())) return;

  try {
    if (frame?.element) frame.element.remove();

    pageView.innerHTML = "";
    frame = controller.createFrame();
    frame.element.id = "nexSiteFrame";
    frame.element.style.cssText = "width:100%;height:100%;border:0;display:block;background:#09070d";
    pageView.appendChild(frame.element);

    frame.go(target);
    lastUrl = target;
    setStatus("nexSite • " + target);
  } catch (error) {
    console.error("[nexSite] navigation failed", error);
    setStatus("navigation failed");
  }
}

function syncAddress(value) {
  if (!value) return;
  url.value = value;
  pageUrl.value = value;
}

function goBack() {
  try { frame?.back(); } catch (error) { console.warn("[nexSite] back failed", error); }
}
function goForward() {
  try { frame?.forward(); } catch (error) { console.warn("[nexSite] forward failed", error); }
}
function reload() {
  try { frame?.reload(); } catch (error) {
    if (lastUrl) navigate(lastUrl);
  }
}

$("#go").onclick = () => navigate(url.value);
$("#openExample").onclick = () => navigate("https://example.com");
$("#back").onclick = goBack;
$("#forward").onclick = goForward;
$("#reload").onclick = reload;
$("#pageGo").onclick = () => navigate(pageUrl.value);
$("#pageBack").onclick = goBack;
$("#pageForward").onclick = goForward;
$("#pageReload").onclick = reload;
$("#homeButton").onclick = showHome;
$("#pageHome").onclick = showHome;

[url, pageUrl].forEach(input => {
  input.addEventListener("keydown", event => {
    if (event.key === "Enter") navigate(input.value);
  });
});

document.querySelectorAll(".quick-card").forEach(card => {
  card.onclick = () => navigate(card.dataset.url);
});

startScramjet();
