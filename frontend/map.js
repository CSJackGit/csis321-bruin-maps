// SVGs or Scalable Vector Graphs does not use the same coordinate system that html expects, each point is a 3x3
// matrix, [a,b,c] [c,d,e] [0, 0 1], where x' = a*x + c*y + e and y' = b*x + d*y + f. 
// Look at reference: https://docs.aspose.com/svg/tutorial/transformation-matrix/
// The biggest challenge with displaying the svg on the html canvas is converting and displaying each building
// after converting it from the svg itself. Some generative AI was used to write these functions

const mapEl = document.getElementById('map');
let svg;
const byKey = {};

// Building name to descriptions
const BUILDINGS = {
  library:     { name: 'Murdock Library',        desc: 'Library' },
  bauman:      { name: 'Bauman Auditorium',      desc: 'Auditorium' },
  stevens:     { name: 'Stevens Center',         desc: 'Student Center' },
  pennington:  { name: 'Pennington Hall',        desc: 'Residence hall' },
  arts:        { name: 'Arts & Cinematic Arts',  desc: 'Art Building' },
  klages:      { name: 'Klages',                 desc: 'Academic Building' },
  hoover:      { name: 'Hoover',                 desc: 'Academic Building' },
  ehs:         { name: 'EHS',                    desc: 'Edwards-Holman Science Center' },
  lemmons:     { name: 'Lemmons Center',         desc: 'Photography and Visual Arts' },
  minthorn:    { name: 'Minthorn Hall',          desc: 'Historic Building' },
  chapel:      { name: 'Chapel',                 desc: 'Chapel' },
  edwards:     { name: 'Edwards Hall',           desc: 'Residence hall' },
  wheelersc:   { name: 'Wheeler Sports Center',  desc: 'Sports Center' },
  dac:         { name: 'Duke Athletic Center',   desc: 'Athletic Center' },
  amphitheater:{ name: 'Amphitheater',           desc: 'Amphitheater' },
  track:       { name: 'Lemmons Field - Track',  desc: 'Track' },
  field:       { name: 'Lemmons Family Field',   desc: 'Football Field' },
  alumni:      { name: 'Alumni Plaza',           desc: 'Mama Bear' },
  stadium:     { name: 'Stoffer Family Stadium', desc: 'Stadium' },
  roy:         { name: 'Roy Apartments',         desc: 'Housing'},
  ross:        { name: 'Ross Center',        desc: 'Academic Building'},
};

//Map builde setup
const mapBuild = {
    nodes: {},
    paths: {}
}

// LoadMap initializes the background canvas with information from the SVG
async function loadMap() {
  const svgRes = await fetch('assets/campus.svg');

  if (!svgRes.ok) {
    console.error('Could not load map:', svgRes.status, svgRes.url);
    return;
  }


  mapEl.innerHTML = await svgRes.text();
  svg = mapEl.querySelector('svg');

  svg.removeAttribute('width');
  svg.removeAttribute('height');

  tagElements();
  buildMapbuild();
  fitToContent();
  initPanZoom(svg);
  initClicks(svg);
  renderResults();

  // Reset route between sessions.
  localStorage.setItem("route", null);
}

/**
 * Reads the SVG file and populates a dictionary of names
 */
function tagElements() {
    // References
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute

    // Read from inkscape svg and generates css
    svg.querySelectorAll('[inkscape\\:label^="building-"]').forEach(element => {
        const key = element.getAttribute('inkscape:label').slice('building-'.length);
        element.classList.add('building');
        element.dataset.key = key;
        byKey[key] = element;
    });

    svg.querySelectorAll('[inkscape\\:label^="path"]').forEach(element => {
        const key = element.getAttribute('inkscape:label').slice('path'.length);
        element.classList.add('path');
        element.dataset.key = key;
    });

    svg.querySelectorAll('[inkscape\\:label^="name-"]').forEach(element => {
        element.classList.add('map-label');
        element.dataset.key = element.getAttribute('inkscape:label').slice('name-'.length);
    });

    svg.querySelectorAll('[inkscape\\:label^="intersection_"]').forEach(element => {
        const key = element.getAttribute('inkscape:label').slice('intersection_'.length);
        element.classList.add('intersection');
    });

    // Temp fix for paths with no data
    svg.querySelectorAll('[inkscape\\:label="Paths-nodata"] path').forEach(element => {
        element.classList.add('path', 'nodata');
    });
}

function buildMapbuild()
{
    mapBuild.nodes =  {};
    mapBuild.paths = {};

    //Creating a system for path building
    svg.querySelectorAll('.intersection').forEach(element => {

        const id = element.getAttribute('inkscape:label').slice('intersection_'.length);

        mapBuild.nodes[id] = {
            id,
            element,
            connections: []
        };
    });

    svg.querySelectorAll('.path').forEach(element => {

        const id = element.dataset.key;
        const length = element.getTotalLength();
        const start = element.getPointAtLength(0);
        const end = element.getPointAtLength(length);

        function nearestNode(point)
        {
            let nearest = null;
            let minDistance = Infinity;

            Object.values(mapBuild.nodes).forEach(node => {
                const bounds = node.element.getBBox();
                const center = 
                {
                    x: bounds.x + bounds.width / 2,
                    y: bounds.y + bounds.height / 2
                };
                const distance = Math.hypot(
                    point.x - center.x,
                    point.y - center.y
                );

                if(distance < minDistance)
                {
                    minDistance = distance;
                    nearest = node;
                }
            });

            return nearest;
        }

        const from = nearestNode(start);
        const to = nearestNode(end);

        if(!from || !to || from.id == to.id) return;

        mapBuild.paths[id] = 
        {
            id,
            element,
            from: from.id,
            to: to.id,
            length
        }

        from.connections.push({
            path: id,
            node: to.id,
            cost: length
        });

        to.connections.push({
            path: id,
            node: from.id,
            cost: length
        });

    });

    console.log('Map Graph:', mapBuild);    
}


/**
 * Gets the bounding box, or viewable proportions of the svg and sets the actual svg to it's viewable size
 * @param {*} pad padding added to outside of
 */
function fitToContent(pad = 8) {
    const b = svg.getBBox();
    svg.setAttribute('viewBox',
        `${b.x - pad} ${b.y - pad} ${b.width + pad * 2} ${b.height + pad * 2}`);
}
/**
 * Computes if an element's bounding box is on the screen of the website
 * @param {*} element 
 * @returns 
 */
function bboxInRoot(element) {
    // See https://stackoverflow.com/questions/34893707/is-there-a-polyfill-for-getintersectionlist-getenclosurelist-checkintersection
    const b = element.getBBox();

    // See https://learn.microsoft.com/sk-sk/previous-versions/windows/internet-explorer/ie-developer/samples/hh535760(v=vs.85)
    // Basically, converts element's local coordinate system to the svg's coordinate system
    const m = svg.getScreenCTM().inverse().multiply(element.getScreenCTM());

    // Takes the element's bounding box and converts each one to the svgs coordinate system
    const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]]
        .map(([x, y]) => new DOMPoint(x, y).matrixTransform(m));
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    return { x: Math.min(...xs), y: Math.min(...ys),  width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
}

/**
 * Rewrites the veiwbox of the svg in response to mouse input.
 * @param {*} svg input svg to zoom/pan to
 */
function initPanZoom(svg) {
    // See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener

    const viewbox = svg.viewBox.baseVal;
    const home = { x: viewbox.x, y: viewbox.y, w: viewbox.width, h: viewbox.height };
    const view = { ...home };
    const apply = () => svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);

    // Converts the screen position that uses mouse coordinates to SVG coordinates
    const toSvg = (cx, cy) => {
        const r = svg.getBoundingClientRect();
        const scale = Math.max(view.w / r.width, view.h / r.height);
        return { x: view.x + (cx - r.left) * scale, y: view.y + (cy - r.top) * scale, scale };
    };

    // Whenever the browser detects a zoom input, it executes the following
    svg.addEventListener('wheel', e => {
        e.preventDefault();
        const f = e.deltaY > 0 ? 1.1 : 1 / 1.1;
        const p = toSvg(e.clientX, e.clientY);
        const newW = Math.min(Math.max(view.w * f, home.w / 20), home.w * 1.5);
        const k = newW / view.w;
        view.x = p.x - (p.x - view.x) * k;
        view.y = p.y - (p.y - view.y) * k;
        view.w *= k; view.h *= k;
        apply();
    }, 
    { passive: false });

    // Only capture the pointer once a real drag starts, so plain clicks still hit the building
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
}

/**
 * Handles selecting a building without it being a pan
 * @param {*} svg input svg 
 */
function initClicks(svg) {
  svg.addEventListener('click', e => {
    if (svg.dataset.dragged === 'true') { 
        svg.dataset.dragged = 'false'; return;
    }
    const el = e.target.closest('.building, .path, .intersection');
    if (el) 
        selectBuilding(el.dataset.key);
  });
}

/**
 * Marks a building as selected, clears the previous selection, can move to building
 * @param {*} key the name of the building, or key
 * @param {*} fly option for moving to the building on the map
 */
function selectBuilding(key, fly = false) {
  const el = byKey[key] || svg.querySelector(`.path[data-key="${key}"]`);
  if (!el) 
    return;

  // unselect everything
  svg.querySelectorAll('.selected').forEach(n => n.classList.remove('selected'));

  // add classList 
  el.classList.add('selected');
  if (fly) 
    svg.flyTo(el);

  // Logs that a building was selected
  // @TODO create a Local Storage Key/Value pair for a list of locations to add to the route
  console.log('Selected', BUILDINGS[key]?.name ?? key);
}

// Gets the current input from the search box
const searchInput = document.querySelector('.search input');
const MAX_DISPLAYED_LOCATIONS = 6;
/**
 * Has templated html code for each search location appearing in the search list
 */
function renderResults() {
    const filter = searchInput.value.trim().toLowerCase();
    const newList = Object.entries(BUILDINGS).map(([id, b]) => ({ id, ...b})).filter(b=> b.name.toLowerCase().includes(filter)).slice(0, MAX_DISPLAYED_LOCATIONS);

    document.getElementById('results').innerHTML = newList.map(l => `
        <div class="search-box-location" data-id="${l.id}">
        <button class="frame" onclick="addToRoute('${l.id}')">
            <div class="ellipse"></div>
            <div class="div"></div>
            <div class="frame-2"></div>
            <div class="add-stop">Add<br/>Stop</div>
        </button>
        <p class="location-name">
            <span class="text-wrapper">${l.name}<br/></span>
            <span class="span">${l.desc}<br/>Distance</span>
        </p>
        </div>`).join('');
}

function updateRouteContainer()
{
    const route = JSON.parse(localStorage.getItem("route")) || [];
    const routeMap = route.map(key => ({ id: key, ...BUILDINGS[key] }));

    document.getElementById('routes').innerHTML = (routeMap.length == 0)
        ? '' : routeMap.map(l => `
        <div class="route">
            <p class="p">
            <span class="text-wrapper-3">${l.name}<br/></span>
            <span class="text-wrapper-4">${l.desc}</span>
            </p>
            <button class="remove-stop" onclick="removeFromRoute('${l.id}')" aria-label="Remove ${l.name}">
            <div class="ellipse-2"></div>
            <div class="frame-3"></div>
            </button>
        </div>`).join('');
}



searchInput.addEventListener('input', renderResults);

//Drop down menu for the search box
const searchBox = document.querySelector('.search-box');

/**
 * Drops down items based on letter imput
 */
searchInput.addEventListener('input', () => {
    const filter = searchInput.value.trim().toLowerCase();

    renderResults();

    const hasMatches = Object.values(BUILDINGS).some(b =>
        b.name.toLowerCase().includes(filter) && filter !== ''
    );

    searchBox.classList.toggle('active', hasMatches);
});

//Removing the box if the screen is clicked anywhere
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search') && !e.target.closest('.search-box'))
    {
        searchBox.classList.remove('active');
    }
});

/**
 * Gets an svg element by id
 */
document.getElementById('results').addEventListener('click', e => {
  const row = e.target.closest('.search-box-location');
  if (!row || e.target.closest('button')) 
    return;
  selectBuilding(row.dataset.id, true);   // select and zoom to it
});

// loads Map on script load
loadMap();