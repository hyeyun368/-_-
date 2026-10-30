// §3.2 JavaScript — 클래스온 랜딩 페이지의 '근육'
// 카운트다운, 쿠폰 받기 버튼(이벤트 → DOM 수정), 앰플리튜드 이벤트 기록
(function () {
  var DEADLINE = new Date("2026-11-25T23:59:59+09:00").getTime();
  var CODE = "HELLO101-50";
  var pad = function (n) { return String(n).padStart(2, "0"); };

  // 앰플리튜드: 방문(페이지 뷰·유입 경로)은 자동 기록, 버튼 클릭은 track()으로 직접 기록
  // §1.5 HTTP — 이벤트는 POST 요청으로 api2.amplitude.com(앰플리튜드 서버)에 보내짐. F12 → Network에서 확인
  var track = function () {};
  try {
    if (window.amplitude) {
      amplitude.init("7740db815e95697619e9a6e2282f1a72", {
        autocapture: { attribution: true, pageViews: true, sessions: true, formInteractions: false, fileDownloads: false, elementInteractions: false }
      });
      track = function (name, props) { try { amplitude.track(name, props); } catch (e) {} };
    }
  } catch (e) {}

  // 유입 채널별 훅 문구 (?utm_source=instagram | youtube | naver)
  var hooks = {
    instagram: "릴스 보고 오셨죠? 첫 달 50% 쿠폰 여기 있어요",
    youtube: "광고 끝까지 본 당신께, 첫 달 50% 쿠폰",
    naver: "검색하신 50% 할인, 여기서 받으세요"
  };
  try {
    var src = new URLSearchParams(location.search).get("utm_source") || location.hash.slice(1);
    if (src && hooks[src.toLowerCase()]) document.getElementById("hook").textContent = hooks[src.toLowerCase()];
  } catch (e) {}

  function tick() {
    var left = Math.max(0, DEADLINE - Date.now());
    var d = Math.floor(left / 864e5), h = Math.floor(left / 36e5) % 24,
        m = Math.floor(left / 6e4) % 60, s = Math.floor(left / 1e3) % 60;
    var text = d + "일 " + pad(h) + ":" + pad(m) + ":" + pad(s);
    document.querySelectorAll("[data-countdown]").forEach(function (el) { el.textContent = text; });
    var units = { d: pad(d), h: pad(h), m: pad(m), s: pad(s) };
    document.querySelectorAll("[data-unit]").forEach(function (el) { el.textContent = units[el.dataset.unit]; });
  }
  tick();
  setInterval(tick, 1000);

  var toastEl = document.getElementById("toast"), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }

  // 기기별 앱 스토어 연결: 모바일은 바로 스토어로, PC는 QR 영역으로
  var ua = navigator.userAgent;
  var platform = /iPhone|iPad|iPod/i.test(ua) ? "ios" : /Android/i.test(ua) ? "android" : "desktop";
  if (platform !== "desktop") {
    document.documentElement.classList.add("is-mobile");
    var mine = document.querySelector('[data-store="' + platform + '"]');
    mine.classList.add("mine");
    mine.parentNode.insertBefore(mine, mine.parentNode.querySelector(".store"));
  }

  var claimed = false;
  function markClaimed() {
    if (claimed) return;
    claimed = true;
    document.getElementById("ticket").classList.add("claimed");
    document.getElementById("code").textContent = CODE;
    document.getElementById("copy").hidden = false;
    document.querySelectorAll("[data-claim]").forEach(function (b) {
      b.textContent = "쿠폰 받음 · 앱 설치하러 가기 →";
    });
    document.querySelector("#dock [data-claim]").textContent = "앱 설치하기";
  }
  function copyCode() {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(CODE).catch(function () {});
  }
  function claim(e) {
    e.preventDefault();
    track("coupon_claim_click", { position: e.currentTarget.dataset.claim, first_claim: !claimed, device: platform });
    markClaimed();
    copyCode();
    if (platform === "desktop") {
      toast("쿠폰 코드를 복사했어요. QR을 찍어 휴대폰에 앱을 설치하세요");
      document.getElementById("download").scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      toast("쿠폰 코드를 복사했어요. 실제 서비스라면 여기서 앱 스토어로 이동해요");
      document.getElementById("download").scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
  document.querySelectorAll("[data-claim]").forEach(function (b) { b.addEventListener("click", claim); });
  document.querySelectorAll(".store").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      track("store_click", { store: a.dataset.store, device: platform });
      markClaimed(); copyCode();
      toast("과제용 시안이라 실제 스토어로 연결되지 않아요");
    });
  });

  // PC 방문자용 QR: 이 페이지를 휴대폰에서 열면 기기에 맞는 스토어로 연결됨
  try {
    if (window.QRCode) {
      new QRCode(document.getElementById("qr"), {
        text: "CLASSON 과제용 시안 · 실제 앱은 없어요", width: 232, height: 232,
        colorDark: "#151517", colorLight: "#FFFFFF", correctLevel: QRCode.CorrectLevel.M
      });
    }
  } catch (e) {}

  document.getElementById("copy").addEventListener("click", function () {
    track("coupon_code_copy", { device: platform });
    var done = function () { toast("쿠폰 코드를 복사했어요"); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(CODE).then(done, function () { selectCode(); });
    } else { selectCode(); }
  });
  function selectCode() {
    var r = document.createRange();
    r.selectNodeContents(document.getElementById("code"));
    var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    toast("코드를 선택했어요. 복사해서 쓰세요");
  }

  // 히어로 버튼이 화면 밖으로 나가면 하단 고정 CTA 표시
  var dock = document.getElementById("dock");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      var show = !entries[0].isIntersecting;
      dock.classList.toggle("show", show);
      dock.setAttribute("aria-hidden", String(!show));
      dock.querySelector("[data-claim]").tabIndex = show ? 0 : -1;
    }).observe(document.getElementById("claim-hero"));
  }
})();
