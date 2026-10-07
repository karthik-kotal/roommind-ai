// -------------------------------------------------------------
// Roommind AI - Main Interactive Application Logic
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initComparisonSlider();
  initPresetSwitching();
  initRenderSimulation();
  initHotspotsAndShopping();
  initPromptStudio();
  init3DPlanner();
  initAICoPilot();
  initExportPackage();
});

/* -------------------------------------------------------------
   1. Tab Navigation System
   ------------------------------------------------------------- */
function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      navBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.add('hidden'));

      btn.classList.add('active');
      const activePane = document.getElementById(`tab-${targetTab}`);
      if (activePane) {
        activePane.classList.remove('hidden');
      }
    });
  });
}

/* -------------------------------------------------------------
   2. Interactive Before / After Image Comparison Slider
   ------------------------------------------------------------- */
function initComparisonSlider() {
  const container = document.getElementById('comparison-container');
  const beforeWrapper = document.getElementById('before-wrapper');
  const handle = document.getElementById('slider-handle');
  const beforeImg = document.getElementById('img-before');
  
  if (!container || !beforeWrapper || !handle || !beforeImg) return;

  let isDragging = false;

  function updateSliderPosition(clientX) {
    const rect = container.getBoundingClientRect();
    let x = clientX - rect.left;
    if (x < 0) x = 0;
    if (x > rect.width) x = rect.width;

    const percentage = (x / rect.width) * 100;
    beforeWrapper.style.width = `${percentage}%`;
    handle.style.left = `${percentage}%`;
    
    // Maintain inner image scale match
    beforeImg.style.width = `${rect.width}px`;
  }

  window.addEventListener('resize', () => {
    const rect = container.getBoundingClientRect();
    beforeImg.style.width = `${rect.width}px`;
  });
  // Initial set
  beforeImg.style.width = `${container.getBoundingClientRect().width}px`;

  handle.addEventListener('mousedown', (e) => {
    isDragging = true;
    e.preventDefault();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updateSliderPosition(e.clientX);
  });

  // Touch support for mobile/tablets
  handle.addEventListener('touchstart', () => { isDragging = true; });
  window.addEventListener('touchend', () => { isDragging = false; });
  window.addEventListener('touchmove', (e) => {
    if (!isDragging || !e.touches[0]) return;
    updateSliderPosition(e.touches[0].clientX);
  });

  // View Mode Toggles (Split vs Full Redesign)
  const btnSplit = document.getElementById('btn-mode-slider');
  const btnAfterOnly = document.getElementById('btn-mode-after');

  if (btnSplit && btnAfterOnly) {
    btnSplit.addEventListener('click', () => {
      btnSplit.classList.add('active');
      btnAfterOnly.classList.remove('active');
      beforeWrapper.style.width = '50%';
      handle.style.left = '50%';
      handle.style.display = 'block';
    });

    btnAfterOnly.addEventListener('click', () => {
      btnAfterOnly.classList.add('active');
      btnSplit.classList.remove('active');
      beforeWrapper.style.width = '0%'; // Hide original overlay, revealing 100% redesigned room
      handle.style.display = 'none';
    });
  }

  // Toggle Hotspot Pins ON / OFF
  const toggleHotspotsBtn = document.getElementById('toggle-hotspots');
  const hotspotsLayer = document.getElementById('hotspots-layer');

  if (toggleHotspotsBtn && hotspotsLayer) {
    let pinsVisible = true;
    toggleHotspotsBtn.addEventListener('click', () => {
      pinsVisible = !pinsVisible;
      hotspotsLayer.style.display = pinsVisible ? 'block' : 'none';
      toggleHotspotsBtn.innerHTML = pinsVisible 
        ? '<i class="fa-solid fa-location-dot"></i> Pins ON' 
        : '<i class="fa-solid fa-eye-slash"></i> Pins OFF';
    });
  }
}

/* -------------------------------------------------------------
   3. Style Presets & Image Mapping
   ------------------------------------------------------------- */
const PRESETS_DATA = {
  japandi: {
    label: 'Japandi Living Room Sanctuary',
    afterImg: '/images/japandi_living_room.jpg',
    beforeImg: '/images/before_dated_room.jpg',
    spaceType: 'living_room',
    swatches: [
      { color: '#E8E2D5', label: 'Cream Bouclé' },
      { color: '#CDB896', label: 'White Oak' },
      { color: '#5E6652', label: 'Muted Olive' },
      { color: '#2C2B29', label: 'Charcoal Steel' },
      { color: '#F4F1EA', label: 'Limewash Plaster' }
    ],
    items: [
      { name: 'Organic Curved Bouclé Sofa', cat: 'Seating', spec: 'Cream Textured Linen', price: 1850 },
      { name: 'Minimalist Oak Coffee Table', cat: 'Tables', spec: 'Solid White Oak', price: 420 },
      { name: '6.5ft Statement Olive Tree', cat: 'Decor', spec: 'Terracotta Clay Vessel', price: 180 },
      { name: 'Architectural Cove LED Kit', cat: 'Lighting', spec: '2700K Warm Glow', price: 310 }
    ],
    hotspots: [
      { top: '68%', left: '50%', pin: 'sofa', name: 'Organic Curved Bouclé Sofa', mat: 'Cream Textured Italian Linen', price: '$1,850' },
      { top: '78%', left: '52%', pin: 'table', name: 'Minimalist Oak Coffee Table', mat: 'Solid White Oak & Matte Seal', price: '$420' },
      { top: '45%', left: '22%', pin: 'plant', name: '6.5ft Statement Olive Tree', mat: 'Terracotta Clay Vessel', price: '$180' },
      { top: '15%', left: '60%', pin: 'lighting', name: 'Architectural Cove LED Kit', mat: '2700K Dimmable Warm Glow', price: '$310' }
    ]
  },
  luxury: {
    label: 'Luxury Dark Walnut Penthouse Bedroom',
    afterImg: '/images/luxury_bedroom.jpg',
    beforeImg: '/images/before_dated_room.jpg',
    spaceType: 'master_bedroom',
    swatches: [
      { color: '#251E1A', label: 'Dark Walnut' },
      { color: '#3A3F47', label: 'Charcoal Linen' },
      { color: '#D4AF37', label: 'Brushed Brass' },
      { color: '#1A1C23', label: 'Matte Slate' },
      { color: '#8C6D53', label: 'Warm Amber Glow' }
    ],
    items: [
      { name: 'Custom Fluted Walnut Bedframe', cat: 'Bedding', spec: 'Dark American Walnut', price: 2450 },
      { name: 'Charcoal Velvet Chaise Lounge', cat: 'Seating', spec: 'Deep Charcoal Weave', price: 920 },
      { name: 'Brass Cylinder Pendant Lamps', cat: 'Lighting', spec: 'Brushed Brass / Dimmable', price: 480 },
      { name: 'Plush Microfiber Area Rug (9x12)', cat: 'Flooring', spec: 'Soft Slate Gray', price: 650 }
    ],
    hotspots: [
      { top: '60%', left: '75%', pin: 'bed', name: 'Custom Fluted Walnut Bedframe', mat: 'Dark American Walnut', price: '$2,450' },
      { top: '65%', left: '25%', pin: 'chaise', name: 'Charcoal Velvet Chaise Lounge', mat: 'Deep Charcoal Weave', price: '$920' },
      { top: '30%', left: '11%', pin: 'pendant', name: 'Brass Cylinder Pendant Lamp', mat: 'Brushed Brass', price: '$480' }
    ]
  },
  bedroom: {
    label: 'Luxury Dark Walnut Penthouse Bedroom',
    afterImg: '/images/luxury_bedroom.jpg',
    beforeImg: '/images/before_dated_room.jpg',
    spaceType: 'master_bedroom',
    swatches: [
      { color: '#251E1A', label: 'Dark Walnut' },
      { color: '#3A3F47', label: 'Charcoal Linen' },
      { color: '#D4AF37', label: 'Brushed Brass' },
      { color: '#1A1C23', label: 'Matte Slate' },
      { color: '#8C6D53', label: 'Warm Amber Glow' }
    ],
    items: [
      { name: 'Custom Fluted Walnut Bedframe', cat: 'Bedding', spec: 'Dark American Walnut', price: 2450 },
      { name: 'Charcoal Velvet Chaise Lounge', cat: 'Seating', spec: 'Deep Charcoal Weave', price: 920 },
      { name: 'Brass Cylinder Pendant Lamps', cat: 'Lighting', spec: 'Brushed Brass / Dimmable', price: 480 },
      { name: 'Plush Microfiber Area Rug (9x12)', cat: 'Flooring', spec: 'Soft Slate Gray', price: 650 }
    ],
    hotspots: [
      { top: '60%', left: '75%', pin: 'bed', name: 'Custom Fluted Walnut Bedframe', mat: 'Dark American Walnut', price: '$2,450' },
      { top: '65%', left: '25%', pin: 'chaise', name: 'Charcoal Velvet Chaise Lounge', mat: 'Deep Charcoal Weave', price: '$920' },
      { top: '30%', left: '11%', pin: 'pendant', name: 'Brass Cylinder Pendant Lamp', mat: 'Brushed Brass', price: '$480' }
    ]
  },
  scandi: {
    label: 'Modern Scandinavian Calacatta Kitchen',
    afterImg: '/images/scandi_kitchen.jpg',
    beforeImg: '/images/before_dated_room.jpg',
    spaceType: 'kitchen',
    swatches: [
      { color: '#F7F7F7', label: 'Calacatta Marble' },
      { color: '#DBC5A4', label: 'Blonde Oak' },
      { color: '#C8A97E', label: 'Polished Brass' },
      { color: '#FFFFFF', label: 'Pure White Ceramic' }
    ],
    items: [
      { name: 'Waterfall Calacatta Marble Island', cat: 'Surfaces', spec: 'Monolithic Quartzite', price: 3800 },
      { name: 'Blonde Oak Bar Stools (Set of 2)', cat: 'Seating', spec: 'Solid Oak & Ergonomic', price: 540 },
      { name: 'Gooseneck Brass Kitchen Faucet', cat: 'Fixtures', spec: 'High-Arc Brushed Gold', price: 390 },
      { name: 'Glass Dome Pendant Lights', cat: 'Lighting', spec: 'Clear Handblown Glass', price: 320 }
    ],
    hotspots: [
      { top: '55%', left: '40%', pin: 'island', name: 'Waterfall Calacatta Island', mat: 'Monolithic Quartzite Marble', price: '$3,800' },
      { top: '65%', left: '75%', pin: 'stools', name: 'Blonde Oak Bar Stools', mat: 'Solid White Oak', price: '$540' },
      { top: '30%', left: '45%', pin: 'faucet', name: 'Gooseneck Brass Faucet', mat: 'Brushed Gold Finish', price: '$390' }
    ]
  },
  kitchen: {
    label: 'Modern Scandinavian Calacatta Kitchen',
    afterImg: '/images/scandi_kitchen.jpg',
    beforeImg: '/images/before_dated_room.jpg',
    spaceType: 'kitchen',
    swatches: [
      { color: '#F7F7F7', label: 'Calacatta Marble' },
      { color: '#DBC5A4', label: 'Blonde Oak' },
      { color: '#C8A97E', label: 'Polished Brass' },
      { color: '#FFFFFF', label: 'Pure White Ceramic' }
    ],
    items: [
      { name: 'Waterfall Calacatta Marble Island', cat: 'Surfaces', spec: 'Monolithic Quartzite', price: 3800 },
      { name: 'Blonde Oak Bar Stools (Set of 2)', cat: 'Seating', spec: 'Solid Oak & Ergonomic', price: 540 },
      { name: 'Gooseneck Brass Kitchen Faucet', cat: 'Fixtures', spec: 'High-Arc Brushed Gold', price: 390 },
      { name: 'Glass Dome Pendant Lights', cat: 'Lighting', spec: 'Clear Handblown Glass', price: 320 }
    ],
    hotspots: [
      { top: '55%', left: '40%', pin: 'island', name: 'Waterfall Calacatta Island', mat: 'Monolithic Quartzite Marble', price: '$3,800' },
      { top: '65%', left: '75%', pin: 'stools', name: 'Blonde Oak Bar Stools', mat: 'Solid White Oak', price: '$540' },
      { top: '30%', left: '45%', pin: 'faucet', name: 'Gooseneck Brass Faucet', mat: 'Brushed Gold Finish', price: '$390' }
    ]
  },
  industrial: {
    label: 'Industrial Modern Brick & Leather Loft',
    afterImg: '/images/industrial_loft.jpg',
    beforeImg: '/images/before_dated_room.jpg',
    spaceType: 'patio',
    swatches: [
      { color: '#9E4735', label: 'Exposed Red Brick' },
      { color: '#8A5229', label: 'Cognac Leather' },
      { color: '#1F2421', label: 'Matte Steel Beams' },
      { color: '#B37D4E', label: 'Rustic Reclaimed Wood' }
    ],
    items: [
      { name: 'Chesterfield Cognac Leather Sofa', cat: 'Seating', spec: 'Top-Grain Italian Leather', price: 2650 },
      { name: 'Reclaimed Oak & Iron Coffee Table', cat: 'Tables', spec: 'Raw Cast Iron & Oak', price: 580 },
      { name: 'Vintage Industrial Tripod Spotlight', cat: 'Lighting', spec: 'Aged Steel & Glass', price: 340 },
      { name: 'Vintage Distressed Oriental Rug', cat: 'Flooring', spec: 'Terracotta & Charcoal Weave', price: 490 }
    ],
    hotspots: [
      { top: '66%', left: '50%', pin: 'sofa', name: 'Cognac Leather Chesterfield Sofa', mat: 'Top-Grain Italian Leather', price: '$2,650' },
      { top: '80%', left: '48%', pin: 'table', name: 'Reclaimed Oak & Iron Coffee Table', mat: 'Raw Steel & Solid Oak', price: '$580' },
      { top: '58%', left: '32%', pin: 'lamp', name: 'Industrial Tripod Floor Lamp', mat: 'Aged Matte Black Steel', price: '$340' }
    ]
  },
  bathroom: {
    label: 'Luxury Dark Slate Spa Bathroom',
    afterImg: '/images/luxury_bathroom.jpg',
    beforeImg: '/images/before_dated_room.jpg',
    spaceType: 'bathroom',
    swatches: [
      { color: '#2B2E33', label: 'Dark Slate Tile' },
      { color: '#EAEAEA', label: 'Matte White Ceramic' },
      { color: '#C5A059', label: 'Brushed Gold Brass' },
      { color: '#3E3228', label: 'Smoked Walnut Vanity' }
    ],
    items: [
      { name: 'Freestanding Oval Acrylic Soaking Tub', cat: 'Plumbing', spec: 'Matte White Acrylic', price: 2890 },
      { name: 'Floating Smoked Walnut Double Vanity', cat: 'Cabinets', spec: 'Solid Walnut & Ceramic Sinks', price: 1950 },
      { name: 'Wall-Mounted Brushed Gold Faucets', cat: 'Fixtures', spec: 'Brushed Brass PVD', price: 620 },
      { name: 'Circular LED Backlit Mirror', cat: 'Mirrors', spec: 'Touch-Dimmable Warm Light', price: 440 }
    ],
    hotspots: [
      { top: '72%', left: '65%', pin: 'tub', name: 'Freestanding Oval Soaking Tub', mat: 'Matte White Acrylic', price: '$2,890' },
      { top: '68%', left: '20%', pin: 'vanity', name: 'Floating Smoked Walnut Vanity', mat: 'Solid Smoked Walnut', price: '$1,950' },
      { top: '32%', left: '16%', pin: 'mirror', name: 'Circular LED Backlit Mirror', mat: 'Dimmable 3000K Halo', price: '$440' }
    ]
  },
  home_office: {
    label: 'Biophilic Live-Edge Walnut Office',
    afterImg: '/images/biophilic_office.jpg',
    beforeImg: '/images/before_dated_room.jpg',
    spaceType: 'home_office',
    swatches: [
      { color: '#4A6B38', label: 'Live Moss Wall' },
      { color: '#5C3A21', label: 'Live-Edge Walnut' },
      { color: '#313236', label: 'Ergonomic Leather' },
      { color: '#C8A97E', label: 'Brass Desk Lamp' }
    ],
    items: [
      { name: 'Custom Live-Edge Walnut Desk', cat: 'Furniture', spec: 'Solid Walnut & Steel Legs', price: 2100 },
      { name: 'Vertical Living Moss Accent Wall', cat: 'Decor', spec: 'Preserved Natural Moss', price: 1450 },
      { name: 'Ergonomic Leather Executive Chair', cat: 'Seating', spec: 'Full-Grain Caramel Leather', price: 780 },
      { name: 'Architectural Brass Task Lamp', cat: 'Lighting', spec: 'Adjustable Brushed Gold', price: 260 }
    ],
    hotspots: [
      { top: '68%', left: '50%', pin: 'desk', name: 'Custom Live-Edge Walnut Desk', mat: 'Solid Walnut & Steel', price: '$2,100' },
      { top: '35%', left: '25%', pin: 'moss', name: 'Preserved Living Moss Wall', mat: 'Natural Nordic Moss', price: '$1,450' },
      { top: '45%', left: '68%', pin: 'lamp', name: 'Architectural Brass Task Lamp', mat: 'Brushed Gold Finish', price: '$260' }
    ]
  }
};

function initPresetSwitching() {
  const presetPills = document.querySelectorAll('.preset-pill');
  const styleCards = document.querySelectorAll('.style-card');
  const spaceSelect = document.getElementById('select-space-type');

  presetPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const presetKey = pill.getAttribute('data-preset');
      if (presetKey === 'custom') {
        document.getElementById('room-photo-input').click();
        return;
      }
      applyPresetData(presetKey);
    });
  });

  styleCards.forEach(card => {
    card.addEventListener('click', () => {
      const styleKey = card.getAttribute('data-style');
      applyPresetData(styleKey);
    });
  });

  if (spaceSelect) {
    spaceSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      const mapping = {
        living_room: 'japandi',
        master_bedroom: 'luxury',
        kitchen: 'scandi',
        bathroom: 'bathroom',
        home_office: 'home_office',
        patio: 'industrial'
      };
      const targetKey = mapping[val] || 'japandi';
      applyPresetData(targetKey);
    });
  }

  // Custom File Upload Trigger
  const triggerBtn = document.getElementById('trigger-upload');
  const fileInput = document.getElementById('room-photo-input');

  if (triggerBtn && fileInput) {
    triggerBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById('img-before').src = event.target.result;
          triggerRenderAnimation('Custom Room Photo Uploaded');
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

function syncUIState(key) {
  // Sync preset pills
  document.querySelectorAll('.preset-pill').forEach(pill => {
    const pKey = pill.getAttribute('data-preset');
    if (pKey === key || (key === 'luxury' && pKey === 'bedroom') || (key === 'scandi' && pKey === 'kitchen')) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  // Sync style cards
  document.querySelectorAll('.style-card').forEach(card => {
    const sKey = card.getAttribute('data-style');
    if (sKey === key || (key === 'bedroom' && sKey === 'luxury') || (key === 'kitchen' && sKey === 'scandi')) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

function applyPresetData(key) {
  const data = PRESETS_DATA[key] || PRESETS_DATA['japandi'];
  
  const imgAfter = document.getElementById('img-after');
  const imgBefore = document.getElementById('img-before');
  const presetLabel = document.getElementById('current-preset-label');
  
  if (imgAfter) imgAfter.src = data.afterImg;
  if (imgBefore && !imgBefore.src.startsWith('data:image')) imgBefore.src = data.beforeImg;
  if (presetLabel) presetLabel.innerHTML = `<i class="fa-solid fa-circle-check"></i> Mode: ${data.label}`;
  
  const spaceSelect = document.getElementById('select-space-type');
  if (spaceSelect && data.spaceType) {
    spaceSelect.value = data.spaceType;
  }

  // Update Swatches
  const swatchesContainer = document.querySelector('.swatches-list');
  if (swatchesContainer && data.swatches) {
    swatchesContainer.innerHTML = data.swatches.map(s => `
      <div class="swatch-item">
        <span class="swatch-color" style="background: ${s.color};"></span>
        <span class="swatch-label">${s.label}</span>
      </div>
    `).join('');
  }

  // Update Dynamic Hotspot Pins
  const hotspotsLayer = document.getElementById('hotspots-layer');
  if (hotspotsLayer && data.hotspots) {
    hotspotsLayer.innerHTML = data.hotspots.map(h => `
      <div class="hotspot-pin" style="top: ${h.top}; left: ${h.left};" data-pin="${h.pin}">
        <div class="pin-pulse"></div>
        <div class="pin-icon"><i class="fa-solid fa-tag"></i></div>
        <div class="hotspot-card">
          <div class="hcard-img" style="background-image: url('${data.afterImg}');"></div>
          <div class="hcard-info">
            <h4>${h.name}</h4>
            <p class="hcard-mat">Material: ${h.mat}</p>
            <div class="hcard-bottom">
              <span class="hcard-price">${h.price}</span>
              <button class="btn btn-xs btn-primary add-item-btn" data-item="${h.pin}">Add to List</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
    
    initHotspotsAndShopping();
  }

  // Update Shopping List
  if (data.items) {
    updateShoppingTable(data.items);
  }

  syncUIState(key);
  triggerRenderAnimation(data.label);
}

/* -------------------------------------------------------------
   4. Render Simulation Loader Overlay
   ------------------------------------------------------------- */
function initRenderSimulation() {
  const btnGenerate = document.getElementById('btn-generate-render');
  if (btnGenerate) {
    btnGenerate.addEventListener('click', () => {
      const styleCard = document.querySelector('.style-card.active');
      const styleName = styleCard ? styleCard.querySelector('.style-name').innerText : 'Selected Interior Style';
      triggerRenderAnimation(styleName);
    });
  }
}

function triggerRenderAnimation(title) {
  const loader = document.getElementById('render-loader');
  const statusText = document.getElementById('loader-status-text');
  const progressFill = document.getElementById('loader-progress');

  if (!loader || !statusText || !progressFill) return;

  loader.classList.remove('hidden');
  progressFill.style.width = '0%';
  
  const steps = [
    { p: 25, text: 'Scanning 3D Room Geometry & Wall Bounds...' },
    { p: 55, text: 'Calculating Natural & Concealed Lighting Physics...' },
    { p: 85, text: `Synthesizing ${title} Textures...` },
    { p: 100, text: 'Finalizing Photorealistic 4K Render!' }
  ];

  let currentStep = 0;
  const interval = setInterval(() => {
    if (currentStep >= steps.length) {
      clearInterval(interval);
      setTimeout(() => {
        loader.classList.add('hidden');
        if (window.confetti) {
          window.confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        }
      }, 400);
      return;
    }

    const s = steps[currentStep];
    progressFill.style.width = `${s.p}%`;
    statusText.innerText = s.text;
    currentStep++;
  }, 400);
}

/* -------------------------------------------------------------
   5. Shopping Table & Budget Calculation
   ------------------------------------------------------------- */
function updateShoppingTable(itemsList) {
  const tbody = document.getElementById('shopping-tbody');
  const totalEl = document.getElementById('total-shopping-amount');
  
  if (!tbody) return;

  let total = 0;
  tbody.innerHTML = itemsList.map((item, idx) => {
    total += item.price;
    return `
      <tr>
        <td class="product-cell">
          <div class="p-thumb" style="background-image: url('${document.getElementById('img-after').src}');"></div>
          <div>
            <strong>${item.name}</strong>
            <div class="p-sub">Item #RM-${1000 + idx * 342}</div>
          </div>
        </td>
        <td><span class="tag-cat">${item.cat}</span></td>
        <td>${item.spec}</td>
        <td>1</td>
        <td class="price-val">$${item.price.toLocaleString()}</td>
        <td><button class="btn btn-xs btn-outline remove-item-btn"><i class="fa-solid fa-trash"></i> Remove</button></td>
      </tr>
    `;
  }).join('');

  if (totalEl) {
    totalEl.innerText = `$${total.toLocaleString()}`;
  }

  initRemoveButtons();
}

function initRemoveButtons() {
  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (row) {
        row.remove();
        recalculateTotal();
      }
    });
  });
}

function recalculateTotal() {
  const priceEls = document.querySelectorAll('#shopping-tbody .price-val');
  let total = 0;
  priceEls.forEach(el => {
    const val = parseInt(el.innerText.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(val)) total += val;
  });
  const totalEl = document.getElementById('total-shopping-amount');
  if (totalEl) totalEl.innerText = `$${total.toLocaleString()}`;
}

function initHotspotsAndShopping() {
  document.querySelectorAll('.add-item-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemKey = btn.getAttribute('data-item');
      btn.innerText = 'Added ✓';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-secondary');

      if (window.confetti) {
        window.confetti({ particleCount: 30, spread: 50 });
      }
    });
  });

  initRemoveButtons();
}

/* -------------------------------------------------------------
   6. Prompt Studio Logic
   ------------------------------------------------------------- */
function initPromptStudio() {
  const promptInput = document.getElementById('prompt-input');
  const runBtn = document.getElementById('btn-run-prompt');
  const budgetSlider = document.getElementById('prompt-budget');
  const budgetVal = document.getElementById('prompt-budget-val');

  if (budgetSlider && budgetVal) {
    budgetSlider.addEventListener('input', (e) => {
      budgetVal.innerText = `$${parseInt(e.target.value).toLocaleString()}`;
    });
  }

  document.querySelectorAll('.chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      if (promptInput) {
        promptInput.value = chip.getAttribute('data-prompt');
      }
    });
  });

  if (runBtn) {
    runBtn.addEventListener('click', () => {
      const text = promptInput ? promptInput.value.toLowerCase() : '';
      const renderImg = document.getElementById('prompt-render-img');

      if (text.includes('bedroom')) {
        renderImg.src = '/images/luxury_bedroom.jpg';
      } else if (text.includes('kitchen')) {
        renderImg.src = '/images/scandi_kitchen.jpg';
      } else {
        renderImg.src = '/images/japandi_living_room.jpg';
      }

      if (window.confetti) {
        window.confetti({ particleCount: 40, spread: 60 });
      }
    });
  }

  // Tag Chips
  document.querySelectorAll('.tag-chip').forEach(tag => {
    tag.addEventListener('click', () => {
      tag.classList.toggle('active');
    });
  });
}

/* -------------------------------------------------------------
   7. 3D Spatial Canvas Planner
   ------------------------------------------------------------- */
function init3DPlanner() {
  const canvas = document.getElementById('planner-canvas');
  if (!canvas) return;

  let activeItem = null;
  let offsetX = 0;
  let offsetY = 0;

  // Make canvas furniture items moveable
  function makeItemMoveable(item) {
    item.addEventListener('mousedown', (e) => {
      if (e.target.closest('.item-controls')) return; // ignore control buttons
      activeItem = item;
      const rect = item.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      e.stopPropagation();
    });

    const rotateBtn = item.querySelector('.rotate-btn');
    const deleteBtn = item.querySelector('.delete-btn');

    if (rotateBtn) {
      rotateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentRot = parseInt(item.getAttribute('data-rot') || '0', 10);
        const newRot = (currentRot + 45) % 360;
        item.setAttribute('data-rot', newRot);
        item.style.transform = `rotate(${newRot}deg)`;
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        item.remove();
      });
    }
  }

  document.querySelectorAll('.placed-item').forEach(makeItemMoveable);

  window.addEventListener('mousemove', (e) => {
    if (!activeItem) return;
    const canvasRect = canvas.getBoundingClientRect();
    let x = e.clientX - canvasRect.left - offsetX;
    let y = e.clientY - canvasRect.top - offsetY;

    if (x < 10) x = 10;
    if (y < 10) y = 10;
    if (x > canvasRect.width - 120) x = canvasRect.width - 120;
    if (y > canvasRect.height - 60) y = canvasRect.height - 60;

    activeItem.style.left = `${x}px`;
    activeItem.style.top = `${y}px`;
  });

  window.addEventListener('mouseup', () => {
    activeItem = null;
  });

  // Drag from palette to canvas
  const dragItems = document.querySelectorAll('.drag-item');
  dragItems.forEach(dItem => {
    dItem.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('type', dItem.getAttribute('data-type'));
      e.dataTransfer.setData('title', dItem.querySelector('span').innerText);
    });
  });

  canvas.addEventListener('dragover', (e) => e.preventDefault());
  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const title = e.dataTransfer.getData('title');
    const canvasRect = canvas.getBoundingClientRect();

    const newItem = document.createElement('div');
    newItem.className = 'placed-item';
    newItem.style.left = `${e.clientX - canvasRect.left - 40}px`;
    newItem.style.top = `${e.clientY - canvasRect.top - 20}px`;
    newItem.setAttribute('data-id', Date.now());

    let iconClass = 'fa-couch';
    if (type === 'table') iconClass = 'fa-table';
    if (type === 'plant') iconClass = 'fa-tree';
    if (type === 'lamp') iconClass = 'fa-lightbulb';
    if (type === 'tv') iconClass = 'fa-tv';
    if (type === 'rug') iconClass = 'fa-rug';

    newItem.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <span>${title}</span>
      <div class="item-controls">
        <button class="rotate-btn"><i class="fa-solid fa-rotate-right"></i></button>
        <button class="delete-btn"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `;

    canvas.appendChild(newItem);
    makeItemMoveable(newItem);
  });

  const resetBtn = document.getElementById('btn-reset-plan');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.querySelectorAll('.placed-item').forEach(el => el.remove());
    });
  }
}

/* -------------------------------------------------------------
   8. AI Co-Pilot Assistant Chat
   ------------------------------------------------------------- */
function initAICoPilot() {
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('btn-send-chat');

  function appendMsg(sender, text) {
    if (!chatMessages) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-bubble ${sender}`;

    const avatarIcon = sender === 'ai' ? 'fa-sparkles' : 'fa-user';
    msgDiv.innerHTML = `
      <div class="avatar"><i class="fa-solid ${avatarIcon}"></i></div>
      <div class="msg-content"><p>${text}</p></div>
    `;

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function handleSend(userText) {
    if (!userText.trim()) return;
    appendMsg('user', userText);
    if (chatInput) chatInput.value = '';

    // Smart Responses
    setTimeout(() => {
      let reply = "That's a great spatial question! For optimal aesthetic flow, consider using neutral base tones (`#E8E2D5`) paired with high-contrast dark walnut accents and concealed 2700K ambient LED strips.";
      const query = userText.toLowerCase();

      if (query.includes('larger') || query.includes('small room')) {
        reply = "To make a small room feel twice as large: 1) Elevate furniture on slender oak legs to reveal more floor surface. 2) Position vertical floor-to-ceiling curtains. 3) Use low-profile curved sofas with light cream bouclé upholstery!";
      } else if (query.includes('palette') || query.includes('color')) {
        reply = "Recommended Japandi & Modern Color Palette: Base: Warm Cream (`#F4F1EA`), Secondary: Light Sand (`#D8CBB5`), Accent: Deep Olive Green (`#5E6652`), Metallic: Brushed Gold / Brass (`#D4AF37`).";
      } else if (query.includes('rug') || query.includes('size')) {
        reply = "For a 16ft × 20ft room: A 9ft × 12ft textured wool rug allows front sofa & chair legs to rest anchored on the rug, defining the conversational seating zone perfectly!";
      }

      appendMsg('ai', reply);
    }, 600);
  }

  if (sendBtn && chatInput) {
    sendBtn.addEventListener('click', () => handleSend(chatInput.value));
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend(chatInput.value);
    });
  }

  document.querySelectorAll('.quick-pbtn').forEach(btn => {
    btn.addEventListener('click', () => handleSend(btn.innerText));
  });
}

/* -------------------------------------------------------------
   9. Export Package & Gallery Handlers
   ------------------------------------------------------------- */
function initExportPackage() {
  const exportBtn = document.getElementById('btn-export-pkg');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (window.confetti) {
        window.confetti({ particleCount: 80, spread: 90 });
      }
      alert('Roommind AI Project Package Exported!\n\nYour package includes:\n• 4K Photorealistic Redesign Render\n• Material Swatch Specs\n• Itemized Shopping List & Furniture Budget\n• 3D Layout Blueprint');
    });
  }

  document.querySelectorAll('.load-gallery-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-preset');
      applyPresetData(preset);
      // Switch back to studio tab
      document.querySelector('.nav-btn[data-tab="studio"]').click();
    });
  });
}
