// Find Similar Images - OpenCV.js Demo
// Algorithms: Histogram Comparison, Template Matching, ORB Feature Matching, Color Histogram (HSV)

// cv is loaded async — all algorithm functions reference cv at call time, not at definition time
const ALGORITHMS = {
  hist_cmp_correl: {
    label: "Histogram Correlation",
    description: "Color histogram comparison using correlation (higher = more similar)",
    compare: (ref, cmp) => histCompare(cv.HISTCMP_CORREL, ref, cmp),
    higherIsBetter: true,
  },
  hist_cmp_intersect: {
    label: "Histogram Intersection",
    description: "Color histogram intersection (higher = more similar)",
    compare: (ref, cmp) => histCompare(cv.HISTCMP_INTERSECT, ref, cmp),
    higherIsBetter: true,
  },
  hist_cmp_bhattacharyya: {
    label: "Histogram Bhattacharyya",
    description: "Color histogram Bhattacharyya distance (lower = more similar)",
    compare: (ref, cmp) => histCompare(cv.HISTCMP_BHATTACHARYYA, ref, cmp),
    higherIsBetter: false,
  },
  template_matching: {
    label: "Template Matching",
    description: "Normalized cross-correlation template matching (higher = more similar)",
    compare: templateMatch,
    higherIsBetter: true,
  },
  orb_matching: {
    label: "ORB Feature Matching",
    description: "ORB keypoint matching with ratio test (more matches = more similar)",
    compare: orbMatch,
    higherIsBetter: true,
  },
  hsv_hist_cmp: {
    label: "HSV Histogram Comparison",
    description: "HSV color space histogram correlation (higher = more similar)",
    compare: hsvHistCompare,
    higherIsBetter: true,
  },
};

// ── Algorithm Implementations ──────────────────────────────────────────────

function histCompare(method, refMat, cmpMat) {
  const refHist = calcRGBHist(refMat);
  const cmpHist = calcRGBHist(cmpMat);
  const result = cv.compareHist(refHist, cmpHist, method);
  refHist.delete();
  cmpHist.delete();
  return result;
}

function calcRGBHist(mat) {
  const rgbPlanes = new cv.MatVector();
  cv.split(mat, rgbPlanes);
  const histSize = 256;
  const ranges = [0, 256];
  const hR = new cv.Mat();
  const hG = new cv.Mat();
  const hB = new cv.Mat();
  cv.calcHist(rgbPlanes, [0], new cv.Mat(), hR, [histSize], ranges);
  cv.calcHist(rgbPlanes, [1], new cv.Mat(), hG, [histSize], ranges);
  cv.calcHist(rgbPlanes, [2], new cv.Mat(), hB, [histSize], ranges);
  cv.normalize(hR, hR, 0, 1, cv.NORM_MINMAX);
  cv.normalize(hG, hG, 0, 1, cv.NORM_MINMAX);
  cv.normalize(hB, hB, 0, 1, cv.NORM_MINMAX);
  // Combine R, G, B histograms into a single 1D histogram
  const combined = new cv.Mat(histSize * 3, 1, cv.CV_32F);
  for (let i = 0; i < histSize; i++) {
    combined.floatPtr(i * 3)[0] = hR.floatPtr(i)[0];
    combined.floatPtr(i * 3 + 1)[0] = hG.floatPtr(i)[0];
    combined.floatPtr(i * 3 + 2)[0] = hB.floatPtr(i)[0];
  }
  hR.delete();
  hG.delete();
  hB.delete();
  rgbPlanes.delete();
  return combined;
}

function hsvHistCompare(refMat, cmpMat) {
  const refHist = calcHSVHist(refMat);
  const cmpHist = calcHSVHist(cmpMat);
  const result = cv.compareHist(refHist, cmpHist, cv.HISTCMP_CORREL);
  refHist.delete();
  cmpHist.delete();
  return result;
}

function calcHSVHist(mat) {
  const hsv = new cv.Mat();
  cv.cvtColor(mat, hsv, cv.COLOR_RGB2HSV);
  const hsvPlanes = new cv.MatVector();
  cv.split(hsv, hsvPlanes);
  const hist = new cv.Mat();
  const hBins = 50,
    sBins = 60;
  cv.calcHist(
    hsvPlanes,
    [0, 1],
    new cv.Mat(),
    hist,
    [hBins, sBins],
    [0, 180, 0, 256]
  );
  cv.normalize(hist, hist, 0, 1, cv.NORM_MINMAX);
  hsv.delete();
  hsvPlanes.delete();
  return hist;
}

function templateMatch(refMat, cmpMat) {
  const resized = new cv.Mat();
  cv.resize(cmpMat, resized, refMat.size());
  const result = new cv.Mat();
  cv.matchTemplate(resized, refMat, result, cv.TM_CCOEFF_NORMED);
  const score = result.data32F[0];
  result.delete();
  resized.delete();
  return score;
}

function orbMatch(refMat, cmpMat) {
  const orb = cv.ORB_create(1000);
  const refKp = new cv.KeyPointVector();
  const refDesc = new cv.Mat();
  const cmpKp = new cv.KeyPointVector();
  const cmpDesc = new cv.Mat();

  orb.detectAndCompute(refMat, new cv.Mat(), refKp, refDesc);
  orb.detectAndCompute(cmpMat, new cv.Mat(), cmpKp, cmpDesc);

  if (refDesc.rows() === 0 || cmpDesc.rows() === 0) {
    refKp.delete();
    refDesc.delete();
    cmpKp.delete();
    cmpDesc.delete();
    return 0;
  }

  const bf = new cv.BFMatcher(cv.NORM_HAMMING);
  const matches = new cv.DMatchVectorVector();
  bf.knnMatch(refDesc, cmpDesc, matches, 2);

  let goodMatches = 0;
  for (let i = 0; i < matches.size(); i++) {
    const m = matches.get(i);
    if (m.size() >= 2) {
      const first = m.get(0);
      const second = m.get(1);
      if (first.distance < 0.75 * second.distance) {
        goodMatches++;
      }
    }
  }

  refKp.delete();
  refDesc.delete();
  cmpKp.delete();
  cmpDesc.delete();
  bf.delete();
  matches.delete();

  return goodMatches;
}

// ── Image Loading Helpers ──────────────────────────────────────────────────

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };
    img.src = url;
  });
}

function imageToMat(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return cv.imread(canvas);
}

// ── UI Construction ─────────────────────────────────────────────────────────

function createUI() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <h1 class="title">🔍 Find Similar Images</h1>
    <p class="subtitle">Select a reference image and a folder of images to compare against, then choose an algorithm.</p>

    <div class="controls">
      <div class="control-group">
        <label class="label">Reference Image</label>
        <div class="file-input-wrapper">
          <input type="file" id="refInput" accept="image/*" class="file-input" />
          <span class="file-input-label" id="refLabel">Choose reference image…</span>
        </div>
        <div id="refPreview" class="preview-container"></div>
      </div>

      <div class="control-group">
        <label class="label">Comparison Images</label>
        <div class="file-input-wrapper">
          <input type="file" id="folderInput" accept="image/*" multiple webkitdirectory class="file-input" />
          <span class="file-input-label" id="folderLabel">Choose image folder…</span>
        </div>
        <div id="folderInfo" class="folder-info"></div>
      </div>

      <div class="control-group">
        <label class="label">Algorithm</label>
        <select id="algorithmSelect" class="select">
          ${Object.entries(ALGORITHMS)
            .map(
              ([key, algo]) =>
                `<option value="${key}">${algo.label}</option>`
            )
            .join("")}
        </select>
        <p id="algoDescription" class="algo-description">${ALGORITHMS.hist_cmp_correl.description}</p>
      </div>

      <button id="compareBtn" class="btn" disabled>Compare Images</button>
    </div>

    <div id="cvStatus" class="cv-status">⏳ Loading OpenCV.js…</div>

    <div id="progress" class="progress" style="display:none;">
      <div id="progressBar" class="progress-bar"></div>
      <span id="progressText" class="progress-text">0%</span>
    </div>

    <div id="results" class="results"></div>
  `;

  // Wire up events
  const refInput = document.getElementById("refInput");
  const folderInput = document.getElementById("folderInput");
  const algorithmSelect = document.getElementById("algorithmSelect");
  const compareBtn = document.getElementById("compareBtn");
  const algoDescription = document.getElementById("algoDescription");

  let refFile = null;
  let cmpFiles = [];

  refInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      refFile = file;
      document.getElementById("refLabel").textContent = file.name;
      showPreview(file, "refPreview");
      updateCompareBtn();
    }
  });

  folderInput.addEventListener("change", (e) => {
    const files = Array.from(e.target.files).filter((f) =>
      f.type.startsWith("image/")
    );
    cmpFiles = files;
    document.getElementById("folderLabel").textContent =
      files.length > 0 ? `${files.length} images selected` : "Choose image folder…";
    document.getElementById("folderInfo").textContent =
      files.length > 0
        ? files.map((f) => f.name).join(", ")
        : "";
    updateCompareBtn();
  });

  algorithmSelect.addEventListener("change", (e) => {
    algoDescription.textContent = ALGORITHMS[e.target.value].description;
  });

  compareBtn.addEventListener("click", () => {
    runComparison(refFile, cmpFiles, algorithmSelect.value);
  });

  function updateCompareBtn() {
    compareBtn.disabled = !(refFile && cmpFiles.length > 0);
  }

  // Wait for OpenCV.js to be ready
  window.cvLoader.promise.then(
    () => {
      document.getElementById("cvStatus").textContent = "✅ OpenCV.js ready";
      document.getElementById("cvStatus").classList.add("ready");
    },
    () => {
      document.getElementById("cvStatus").textContent = "❌ Failed to load OpenCV.js";
      document.getElementById("cvStatus").classList.add("error");
    }
  );
}

function showPreview(file, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const url = URL.createObjectURL(file);
  const img = document.createElement("img");
  img.src = url;
  img.className = "preview-image";
  img.onload = () => URL.revokeObjectURL(url);
  container.appendChild(img);
}

// ── Comparison Logic ───────────────────────────────────────────────────────

async function runComparison(refFile, cmpFiles, algorithmKey) {
  const algo = ALGORITHMS[algorithmKey];
  const progress = document.getElementById("progress");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");
  const results = document.getElementById("results");
  const compareBtn = document.getElementById("compareBtn");

  compareBtn.disabled = true;
  compareBtn.textContent = "Comparing…";
  progress.style.display = "block";
  progressBar.style.width = "0%";
  progressText.textContent = "0%";
  results.innerHTML = "";

  try {
    // Wait for OpenCV to be ready
    await window.cvLoader.promise;

    // Load reference image
    const refImg = await loadImageFromFile(refFile);
    const refMat = imageToMat(refImg);

    const scores = [];

    for (let i = 0; i < cmpFiles.length; i++) {
      const file = cmpFiles[i];
      try {
        const img = await loadImageFromFile(file);
        const mat = imageToMat(img);
        const score = algo.compare(refMat, mat);
        scores.push({ file, score, name: file.name });
        mat.delete();
      } catch (err) {
        console.warn(`Skipping ${file.name}:`, err);
        scores.push({ file, score: null, name: file.name });
      }

      const pct = Math.round(((i + 1) / cmpFiles.length) * 100);
      progressBar.style.width = pct + "%";
      progressText.textContent = pct + "%";

      // Yield to UI
      await new Promise((r) => setTimeout(r, 0));
    }

    refMat.delete();

    // Sort results
    scores.sort((a, b) => {
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return algo.higherIsBetter
        ? b.score - a.score
        : a.score - b.score;
    });

    // Display results
    displayResults(scores, algo);
  } catch (err) {
    results.innerHTML = `<div class="error">Error: ${err.message}</div>`;
    console.error(err);
  } finally {
    compareBtn.disabled = false;
    compareBtn.textContent = "Compare Images";
    setTimeout(() => {
      progress.style.display = "none";
    }, 500);
  }
}

function displayResults(scores, algo) {
  const results = document.getElementById("results");

  if (scores.length === 0) {
    results.innerHTML = '<p class="no-results">No images to compare.</p>';
    return;
  }

  const validScores = scores.filter((s) => s.score !== null).map((s) => s.score);
  const bestScore = Math.max(...validScores);
  const worstScore = Math.min(...validScores);

  let html = `<h2 class="results-title">Results (${algo.label})</h2>`;
  html += '<div class="results-grid">';

  scores.forEach((item, idx) => {
    const scoreStr =
      item.score !== null ? item.score.toFixed(4) : "N/A";
    const rank = idx + 1;
    const isTop = rank <= 3 && item.score !== null;

    // Compute a visual bar width (normalize to 0-100)
    let barWidth = 0;
    if (item.score !== null && bestScore !== worstScore) {
      if (algo.higherIsBetter) {
        barWidth = Math.max(
          5,
          ((item.score - worstScore) / (bestScore - worstScore)) * 100
        );
      } else {
        barWidth = Math.max(
          5,
          ((worstScore - item.score) / (worstScore - bestScore)) * 100
        );
      }
    } else if (item.score !== null) {
      barWidth = 100;
    }

    const url = URL.createObjectURL(item.file);

    html += `
      <div class="result-card ${isTop ? "top-result" : ""}">
        <span class="rank">#${rank}</span>
        <img src="${url}" class="result-image" alt="${item.name}" loading="lazy" />
        <div class="result-info">
          <span class="result-name" title="${item.name}">${item.name}</span>
          <div class="score-bar-container">
            <div class="score-bar" style="width:${barWidth}%"></div>
          </div>
          <span class="result-score">${scoreStr}</span>
        </div>
      </div>
    `;
  });

  html += "</div>";
  results.innerHTML = html;
}

// ── Initialize ──────────────────────────────────────────────────────────────

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", createUI);
} else {
  createUI();
}
