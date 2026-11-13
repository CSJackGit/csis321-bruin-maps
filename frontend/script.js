window.addEventListener('load', function() {
  const mapObject = document.getElementById('campus-map');

  // 1. Gain internal DOM access to the SVG file contents
  const svgDoc = mapObject.contentDocument;
  const svgElement = svgDoc.getElementById('svg1');

  // 2. Initialize the smooth zoom and pan with bounds checking
  const panZoomInstance = svgPanZoom(svgElement, {
    zoomEnabled: true,
    controlIconsEnabled: true,
    fit: true,
    center: true,
    minZoom: 1,
    maxZoom: 8,
    beforePan: function(oldPan, newPan) {
      const sizes = this.getSizes();
      const leftLimit = -((sizes.viewBox.width * sizes.realZoom) - sizes.width);
      const topLimit = -((sizes.viewBox.height * sizes.realZoom) - sizes.height);
      const rightLimit = 0;
      const bottomLimit = 0;

      return {
        x: Math.max(leftLimit, Math.min(rightLimit, newPan.x)),
        y: Math.max(topLimit, Math.min(bottomLimit, newPan.y))
      };
    }
  });

  // 3. Attach standard web hover/click listeners to buildings
  const buildings = svgDoc.querySelectorAll('rect[inkscape\\:label^="building-"]');
  
  buildings.forEach(building => {
    building.style.cursor = 'pointer';
    
    building.addEventListener('click', function(e) {
      const label = e.target.getAttribute('inkscape:label');
      console.log("Clicked on building label:", label);
      
      // Clear previous highlights and assign new highlight class
      clearAllHighlights(svgDoc);
      e.target.classList.add('destination-highlight');
    });
  });


  const paths = svgDoc.querySelectorAll('path[inkscape\\:label^="path_"]');

  paths.forEach(path => {
    path.classList.add("path");
    path.style.cursor = 'pointer';

    path.addEventListener('click', function(e) {
        e.stopPropagation();

        const clickedPath = e.currentTarget;
        const label = clickedPath.getAttribute('inkscape:label');

        console.log("Clicked on path", label);

        clearAllHighlights(svgDoc);
        clickedPath.classList.add('destination-highlight');
    });
  });
});

// Helper Function: Clear active map pins/fills
function clearAllHighlights(svgDoc) {
  svgDoc.querySelectorAll('.destination-highlight').forEach(el => {
    el.classList.remove('destination-highlight');
  });
}

// Global Function: Trigger highlight from sidebar buttons
window.highlightDestination = function(targetLabel) {
  const mapObject = document.getElementById('campus-map');
  const svgDoc = mapObject.contentDocument;
  
  clearAllHighlights(svgDoc);
  
  const targetBuilding = svgDoc.querySelector(`[inkscape\\:label="${targetLabel}"]`);
  if (targetBuilding) {
    targetBuilding.classList.add('destination-highlight');
  } else {
    console.warn(`Building with label "${targetLabel}" not found.`);
  }
};

// Add event listener directly to your parent layout map component
document.getElementById('rect2189').addEventListener('click', function(e) {
    // 1. Remove previous destination assignments across your layer elements
    document.querySelectorAll('.interactive-shape').forEach(el => {
        el.classList.remove('is-destination');
    });

    // 2. Assign active state rule directly to the targeted clicked rectangle element
    this.classList.add('is-destination');
});


let drag = null;
    svg.addEventListener('pointerdown', e => {
        drag = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
    });

    // Whenever you click and move with your mouse, it will find the change in position of the x/y coordinates and apply them to the svg
    svg.addEventListener('pointermove', e => {
        if (!drag) 
            return;
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.moved) {
            if (Math.abs(dx) + Math.abs(dy) < 4) 
                return;
            drag.moved = true;
            svg.setPointerCapture(drag.id);
        }
        const { scale } = toSvg(0, 0);
        view.x -= dx * scale; view.y -= dy * scale;
        drag.x = e.clientX; drag.y = e.clientY;
        apply();
    });

    // When you stop clicking
    svg.addEventListener('pointerup', () => {
        svg.dataset.dragged = drag?.moved ? 'true' : 'false';
        drag = null;
    });

    // When you leave the screen while clicking
    svg.addEventListener('pointercancel', () => { 
        drag = null; 
    });

    // An external way to select a building (i.e. searching locations)
    svg.flyTo = (el) => {
        const b = bboxInRoot(el);
        const aspect = view.w / view.h;
        const pad = Math.max(b.width, b.height) * 3;
        view.w = Math.max(b.width + pad, (b.height + pad) * aspect);
        view.h = view.w / aspect;
        view.x = b.x + b.width / 2 - view.w / 2;
        view.y = b.y + b.height / 2 - view.h / 2;
        apply();
    };