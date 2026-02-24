function exportSegmentation() {
  const data = {
    url: location.href,
    precision: segmentationPrecision,
    regions: segmentationRegions
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "segmentation.json";
  a.click();
}

function importSegmentation(json) {
  segmentationPrecision = json.precision;
  segmentationRegions = json.regions.map(r => {
    const el = document.querySelector(r.selector);
    if (!el) return null;

    const rect = el.getBoundingClientRect();
    r.rect = {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    };

    return r;
  }).filter(Boolean);

  renderRegions(segmentationRegions);
}
