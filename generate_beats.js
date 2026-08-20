const fs = require('fs');
const path = require('path');

const compositionsDir = path.join(__dirname, 'tutorial-video', 'compositions');

const injections = `
  <!-- GSAP & HyperFrames -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://hyperframes.dev/client.js"></script>

  <!-- Video Overlays -->
  <style>
    #cursor {
      position: absolute;
      top: 0; left: 0;
      width: 32px; height: 32px;
      z-index: 9999;
      transform-origin: 0 0;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
      opacity: 0;
      visibility: hidden;
    }
    #subtitle-container {
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 500;
      text-align: center;
      max-width: 80%;
      z-index: 9998;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      backdrop-filter: blur(4px);
      opacity: 0;
      visibility: hidden;
    }
  </style>

  <svg id="cursor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4 L11 26 L15 17 L24 21 L27 18 L18 14 L26 10 Z" fill="#ffffff" stroke="#000000" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>

  <div id="subtitle-container"></div>
`;

function injectBeat(sourceFile, targetFile, compId, duration, scriptContent) {
  let html = fs.readFileSync(path.join(__dirname, sourceFile), 'utf-8');
  
  // Fix non-deterministic Date issues in prototype JS
  html = html.replace(/new Date\(\)/g, "(new (function(){ this.toLocaleDateString = () => '14 Aug 2026'; this.toLocaleTimeString = () => '12:00'; })())");

  // Fix font-family: inherit causing interactive prompt in hyperframes
  html = html.replace(/font-family:\s*inherit;/g, "font-family: 'Inter', sans-serif;");

  // Inject root wrapper after body
  html = html.replace('<body>', '<body>\\n<div data-composition-id="' + compId + '" data-width="1920" data-height="1080" data-duration="' + duration + '">');

  const insertIndex = html.lastIndexOf('</body>');
  
  if (insertIndex === -1) {
    console.error("Could not find </body> in " + sourceFile);
    return;
  }

  const finalHtml = html.substring(0, insertIndex) + 
                    injections + 
                    "\n  <script>\n" + 
                    scriptContent + 
                    "\n  </script>\n" + 
                    "</div>\n" + // close root wrapper
                    html.substring(insertIndex);

  fs.writeFileSync(path.join(compositionsDir, targetFile), finalHtml, 'utf-8');
  console.log("Generated " + targetFile);
}

// Beat 1: Dashboard (19s)
const beat1Script = `
    gsap.set("#subtitle-container", { autoAlpha: 0 });
    gsap.set("#cursor", { x: 500, y: 800, autoAlpha: 0 });

    const tl = gsap.timeline();

    tl.to("#cursor", { autoAlpha: 1, duration: 0.5 })
      .to("#subtitle-container", { autoAlpha: 1, duration: 0.5 }, "<")
      .set("#subtitle-container", { textContent: "Welcome to the Labour Market Portal." })
      .to("#cursor", { x: 400, y: 200, duration: 2, ease: "power2.inOut" })
      .to({}, { duration: 1 })
      .set("#subtitle-container", { textContent: "The dashboard provides a real-time overview..." })
      .to("#cursor", { x: 800, y: 200, duration: 1.5, ease: "power2.inOut" })
      .to({}, { duration: 1 })
      .set("#subtitle-container", { textContent: "...of national employment metrics and skill demands." })
      .to("#cursor", { x: 800, y: 400, duration: 2, ease: "power2.inOut" })
      .to({}, { duration: 1.5 })
      .to("#cursor", { autoAlpha: 0, duration: 0.5 })
      .to("#subtitle-container", { autoAlpha: 0, duration: 0.5 }, "<");
`;
injectBeat('index.html', 'beat-01-dashboard.html', 'beat-01', 19, beat1Script);

// Beat 2: Verifying an Employer (19s)
const beat2Script = `
    gsap.set("#subtitle-container", { autoAlpha: 0 });
    gsap.set("#cursor", { x: 100, y: 200, autoAlpha: 0 }); 

    const tl = gsap.timeline();

    tl.to("#cursor", { autoAlpha: 1, duration: 0.5 })
      .to("#subtitle-container", { autoAlpha: 1, duration: 0.5 }, "<")
      .set("#subtitle-container", { textContent: "Administrators can easily monitor private-sector compliance..." })
      .to("#cursor", { x: 790, y: 580, duration: 2, ease: "power2.inOut" }) 
      .to({}, { duration: 1 })
      .set("#subtitle-container", { textContent: "...and verify newly registered employers with a single click." })
      .to("#cursor", { scale: 0.8, duration: 0.1 })
      .to("#cursor", { scale: 1, duration: 0.1 })
      .to({}, { duration: 1.5 })
      .to("#cursor", { autoAlpha: 0, duration: 0.5 })
      .to("#subtitle-container", { autoAlpha: 0, duration: 0.5 }, "<");
`;
injectBeat('entities.html', 'beat-02-verification.html', 'beat-02', 19, beat2Script);

// Beat 3: Analyzing Skill Gaps (11s)
const beat3Script = `
    gsap.set("#subtitle-container", { autoAlpha: 0 });
    gsap.set("#cursor", { x: 100, y: 300, autoAlpha: 0 });

    const tl = gsap.timeline();

    tl.to("#cursor", { autoAlpha: 1, duration: 0.5 })
      .to("#subtitle-container", { autoAlpha: 1, duration: 0.5 }, "<")
      .set("#subtitle-container", { textContent: "Use the Skill Gap Report to identify critical worker shortages..." })
      .to("#cursor", { x: 600, y: 250, duration: 1.5, ease: "power2.inOut" }) 
      .to({}, { duration: 1 })
      .set("#subtitle-container", { textContent: "...and discover data-driven training recommendations." })
      .to("#cursor", { x: 700, y: 450, duration: 2, ease: "power2.inOut" }) 
      .to({}, { duration: 1.5 })
      .to("#cursor", { autoAlpha: 0, duration: 0.5 })
      .to("#subtitle-container", { autoAlpha: 0, duration: 0.5 }, "<");
`;
injectBeat('skill-gap.html', 'beat-03-skill-gap.html', 'beat-03', 11, beat3Script);

// Beat 4: Generating Reports (15s)
const beat4Script = `
    gsap.set("#subtitle-container", { autoAlpha: 0 });
    gsap.set("#cursor", { x: 100, y: 400, autoAlpha: 0 });

    const tl = gsap.timeline();

    tl.to("#cursor", { autoAlpha: 1, duration: 0.5 })
      .to("#subtitle-container", { autoAlpha: 1, duration: 0.5 }, "<")
      .set("#subtitle-container", { textContent: "Exporting evidence-based operational reports to PDF or Excel..." })
      .to("#cursor", { x: 780, y: 260, duration: 2, ease: "power2.inOut" }) 
      .to({}, { duration: 1 })
      .set("#subtitle-container", { textContent: "...is simple and secure." })
      .to("#cursor", { scale: 0.8, duration: 0.1 })
      .to("#cursor", { scale: 1, duration: 0.1 })
      .to({}, { duration: 1.5 })
      .to("#cursor", { autoAlpha: 0, duration: 0.5 })
      .to("#subtitle-container", { autoAlpha: 0, duration: 0.5 }, "<");
`;
injectBeat('general-report.html', 'beat-04-reports.html', 'beat-04', 15, beat4Script);

// Beat 5: Audit and Compliance (16s)
const beat5Script = `
    gsap.set("#subtitle-container", { autoAlpha: 0 });
    gsap.set("#cursor", { x: 100, y: 450, autoAlpha: 0 });

    const tl = gsap.timeline();

    tl.to("#cursor", { autoAlpha: 1, duration: 0.5 })
      .to("#subtitle-container", { autoAlpha: 1, duration: 0.5 }, "<")
      .set("#subtitle-container", { textContent: "Finally, the immutable Activity Log ensures total transparency..." })
      .to("#cursor", { x: 500, y: 150, duration: 1.5, ease: "power2.inOut" }) 
      .to({}, { duration: 1 })
      .set("#subtitle-container", { textContent: "...and accountability across all ministry actions." })
      .to("#cursor", { x: 400, y: 400, duration: 2, ease: "power2.inOut" }) 
      .to({}, { duration: 1.5 })
      .to("#cursor", { autoAlpha: 0, duration: 0.5 })
      .to("#subtitle-container", { autoAlpha: 0, duration: 0.5 }, "<");
`;
injectBeat('activity-logs.html', 'beat-05-audit.html', 'beat-05', 16, beat5Script);
