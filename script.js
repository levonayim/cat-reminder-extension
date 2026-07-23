function initWidget() {
  let wrapper = document.querySelector('.controls-wrapper');

  // If wrapper doesn't exist (Extension mode), inject it dynamically
  if (!wrapper) {
    const catImageUrl = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL 
      ? chrome.runtime.getURL('cat-moveupdown.webp') 
      : 'cat-moveupdown.webp';

    wrapper = document.createElement('div');
    wrapper.className = 'controls-wrapper';

    wrapper.innerHTML = `
      <div id="pixel-pet" class="pixel-pet resting">
        <div id="speech-bubbles" class="speech-bubbles"></div>
        <span id="pet-avatar"><img src="${catImageUrl}" alt="Cat Pet" /></span>
      </div>

      <div id="controls-panel" class="controls-panel collapsed">
        <div class="panel-header" id="cat-panel-header" title="Drag to move panel">
          <span class="drag-handle">⋮⋮</span>
          <h3>Cat Companion</h3>
          <span id="collapse-icon" class="collapse-icon">▼</span>
        </div>

        <div id="panel-content" class="panel-content">
          <div class="button-group">
            <button id="toggle-movement-btn" class="btn action-btn">🐾 Start Moving</button>
          </div>

          <div class="reminder-input-container">
            <input type="text" id="reminder-input" placeholder="Type a reminder..." maxlength="100" />
            <button class="btn add-btn" id="add-reminder-btn">Add</button>
          </div>

          <div id="reminders-list" class="reminders-list"></div>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);
  }

  // Restore last saved position if present
  const savedTop = localStorage.getItem('cat_widget_top');
  const savedLeft = localStorage.getItem('cat_widget_left');
  if (savedTop !== null && savedLeft !== null) {
    wrapper.style.setProperty('top', savedTop, 'important');
    wrapper.style.setProperty('left', savedLeft, 'important');
    wrapper.style.setProperty('bottom', 'auto', 'important');
    wrapper.style.setProperty('right', 'auto', 'important');
  }

  // Attach button and collapse event listeners safely
  const collapseIcon = document.getElementById('collapse-icon');
  if (collapseIcon) collapseIcon.onclick = togglePanel;

  const toggleBtn = document.getElementById('toggle-movement-btn');
  if (toggleBtn) toggleBtn.onclick = toggleMovement;

  const addBtn = document.getElementById('add-reminder-btn');
  if (addBtn) addBtn.onclick = addReminder;

  const input = document.getElementById('reminder-input');
  if (input) {
    input.onkeypress = function(e) {
      if (e.key === 'Enter') addReminder();
    };
  }

  // Attach Dragging via header element selector
  const header = document.getElementById('cat-panel-header') || document.querySelector('.panel-header');
  if (header) {
    makeDraggable(wrapper, header);
  }
}

// Universal Dragging Handler
function makeDraggable(element, dragHandle) {
  let shiftX = 0;
  let shiftY = 0;

  dragHandle.addEventListener('pointerdown', (e) => {
    // Don't drag if user clicked the collapse arrow button
    if (e.target.id === 'collapse-icon' || e.target.classList.contains('collapse-icon')) return;

    e.preventDefault(); // Stop native selection/dragging in Safari
    dragHandle.setPointerCapture(e.pointerId);

    const rect = element.getBoundingClientRect();
    shiftX = e.clientX - rect.left;
    shiftY = e.clientY - rect.top;

    // Convert element to top/left positioning
    element.style.setProperty('bottom', 'auto', 'important');
    element.style.setProperty('right', 'auto', 'important');
    element.style.setProperty('left', `${rect.left}px`, 'important');
    element.style.setProperty('top', `${rect.top}px`, 'important');

    function onPointerMove(moveEvent) {
      element.style.setProperty('left', `${moveEvent.clientX - shiftX}px`, 'important');
      element.style.setProperty('top', `${moveEvent.clientY - shiftY}px`, 'important');
    }

    function onPointerUp(upEvent) {
      try {
        dragHandle.releasePointerCapture(upEvent.pointerId);
      } catch (err) {}

      dragHandle.removeEventListener('pointermove', onPointerMove);
      dragHandle.removeEventListener('pointerup', onPointerUp);

      // Save position across reloads
      localStorage.setItem('cat_widget_top', element.style.top);
      localStorage.setItem('cat_widget_left', element.style.left);
    }

    dragHandle.addEventListener('pointermove', onPointerMove);
    dragHandle.addEventListener('pointerup', onPointerUp);
  });

  dragHandle.ondragstart = () => false;
}

// Initialize when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidget);
} else {
  initWidget();
}

// --- Logic Helpers ---
let reminders = [];
let isMoving = false;

function togglePanel(e) {
  if (e) e.stopPropagation();
  const panel = document.getElementById('controls-panel');
  if (panel) panel.classList.toggle('collapsed');
}

function toggleMovement() {
  const pet = document.getElementById('pixel-pet');
  const button = document.getElementById('toggle-movement-btn');
  if (!pet || !button) return;

  isMoving = !isMoving;

  if (isMoving) {
    pet.classList.remove('resting');
    void pet.offsetWidth;
    pet.classList.add('running');
    button.textContent = '🛋️ Sit Down';
  } else {
    pet.classList.remove('running');
    pet.classList.add('resting');
    button.textContent = '🐾 Start Moving';
  }
}

function addReminder() {
  const input = document.getElementById('reminder-input');
  if (!input) return;
  const text = input.value.trim();
  if (text === '') return;

  reminders.push(text);
  input.value = '';
  renderReminders();
}

function removeReminder(index) {
  reminders.splice(index, 1);
  renderReminders();
}

function renderReminders() {
  const bubblesContainer = document.getElementById('speech-bubbles');
  const listContainer = document.getElementById('reminders-list');
  if (!bubblesContainer || !listContainer) return;

  bubblesContainer.innerHTML = reminders
    .map(text => `<div class="bubble">• ${escapeHtml(text)}</div>`)
    .join('');

  listContainer.innerHTML = reminders
    .map((text, index) => `
      <div class="reminder-item">
        <span>${escapeHtml(text)}</span>
        <button class="clear-btn" data-index="${index}">✕</button>
      </div>
    `)
    .join('');

  document.querySelectorAll('.clear-btn').forEach(btn => {
    btn.onclick = (e) => removeReminder(e.target.getAttribute('data-index'));
  });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
  });
}