(function(){
  const TOKEN_KEY = 'admin_token';
  
  const state = {
    currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    selectedDateISO: null,
    selectedTime: null,
    lang: localStorage.getItem('lang') || 'ru',
    theme: localStorage.getItem('theme') || 'dark',
    workday: { start: '09:00', end: '18:30' },
    availabilityCache: {},
    isAdmin: false,
    currentView: 'welcome', // welcome | booking | admin
  };

  const i18n = {
    ru: { 
      day:'День', evening:'Вечер', formTitle:'Запись на прием', name:'Имя', phone:'Телефон', 
      noSlot:'Выберите дату и время', book:'Записаться', success:'Заявка отправлена успешно!', 
      booked:'Забронировано', months:['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'], 
      privacy:'Отправляя заявку, вы соглашаетесь с обработкой персональных данных', full:'Занято',
      welcomeTitle: 'Добро пожаловать!',
      welcomeText: 'Воспользуйтесь нашим сервисом онлайн-записи. Выберите удобную дату и время для посещения.',
      startBooking: 'Начать запись',
      adminLogin: 'Вход в админ-панель',
      username: 'Логин',
      password: 'Пароль',
      login: 'Войти',
      invalidName: 'Имя должно содержать только буквы',
      invalidPhone: 'Некорректный номер телефона',
      loginFailed: 'Неверный логин или пароль',
      error: 'Ошибка',
      connectionError: 'Ошибка соединения',
      validationError: 'Ошибка валидации',
      emptyBookings: 'Заявок нет',
      pending: 'Ожидает',
      approved: 'Подтверждена',
      rejected: 'Отклонена',
      approve: 'Подтвердить',
      reject: 'Отклонить',
      approveError: 'Ошибка подтверждения',
      rejectError: 'Ошибка отклонения',
      selectDate: 'Выбрать дату'
    },
    en: { 
      day:'Day', evening:'Evening', formTitle:'Book an appointment', name:'Name', phone:'Phone', 
      noSlot:'Select date and time', book:'Book', success:'Request sent successfully!', 
      booked:'Booked', months:['January','February','March','April','May','June','July','August','September','October','November','December'], 
      privacy:'By submitting you agree to the Privacy Policy', full:'Full',
      welcomeTitle: 'Welcome!',
      welcomeText: 'Use our online booking service. Choose a convenient date and time for your visit.',
      startBooking: 'Start Booking',
      adminLogin: 'Admin Login',
      username: 'Username',
      password: 'Password',
      login: 'Login',
      invalidName: 'Name must contain only letters',
      invalidPhone: 'Invalid phone number',
      loginFailed: 'Invalid username or password',
      error: 'Error',
      connectionError: 'Connection error',
      validationError: 'Validation error',
      emptyBookings: 'No bookings',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      approve: 'Approve',
      reject: 'Reject',
      approveError: 'Approve error',
      rejectError: 'Reject error',
      selectDate: 'Select date'
    }
  };

  const elements = {
    // Welcome
    welcomeSection: document.getElementById('welcomeSection'),
    startBooking: document.getElementById('startBooking'),
    
    // Booking
    bookingSection: document.getElementById('bookingSection'),
    monthLabel: document.getElementById('monthLabel'), 
    calendarGrid: document.getElementById('calendarGrid'), 
    prevMonth: document.getElementById('prevMonth'), 
    nextMonth: document.getElementById('nextMonth'), 
    daySlots: document.getElementById('daySlots'), 
    eveningSlots: document.getElementById('eveningSlots'), 
    selectedSlot: document.getElementById('selectedSlot'), 
    bookingForm: document.getElementById('bookingForm'), 
    submitBtn: document.getElementById('submitBtn'), 
    toast: document.getElementById('toast'), 
    nameInput: document.getElementById('name'),
    phoneInput: document.getElementById('phone'),
    nameError: document.getElementById('nameError'),
    phoneError: document.getElementById('phoneError'),
    
    // Admin
    adminSection: document.getElementById('adminSection'),
    adminBtn: document.getElementById('adminBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    loginModal: document.getElementById('loginModal'),
    closeModal: document.getElementById('closeModal'),
    loginForm: document.getElementById('loginForm'),
    loginError: document.getElementById('loginError'),
    dateFilter: document.getElementById('dateFilter'),
    clearFilter: document.getElementById('clearFilter'),
    bookingsList: document.getElementById('bookingsList'),
    
    // Common
    customLangSelect: document.getElementById('customLangSelect'),
    themeToggle: document.getElementById('themeToggle')
  };
  
  // Initialize custom select
  function initCustomSelect() {
    const selectElement = elements.customLangSelect;
    if(!selectElement) return;
    
    const selected = selectElement.querySelector('.select-selected');
    const items = selectElement.querySelector('.select-items');
    const options = items.querySelectorAll('div');
    
    // Update selected text based on current language
    const langText = state.lang === 'ru' ? 'RU' : 'EN';
    selected.textContent = langText;
    
    selected.addEventListener('click', function(e) {
      e.stopPropagation();
      closeAllSelect(this);
      items.classList.toggle('select-hide');
      this.classList.toggle('select-arrow-active');
    });
    
    options.forEach(option => {
      option.addEventListener('click', function(e) {
        e.stopPropagation();
        const value = this.getAttribute('data-value');
        selected.textContent = this.textContent;
        items.classList.add('select-hide');
        selected.classList.remove('select-arrow-active');
        
        // Change language
        if(value !== state.lang) {
          state.lang = value;
          localStorage.setItem('lang', state.lang);
          applyLang(state.lang);
          renderCalendar();
          renderSlots();
          if(state.isAdmin && state.currentView === 'admin') {
            loadBookings();
          }
          // Update date picker text
          const dateText = document.getElementById('dateText');
          if(dateText && dateText.textContent !== 'Выбрать дату' && dateText.textContent !== 'Select date') {
            dateText.textContent = state.lang === 'ru' ? 'Выбрать дату' : 'Select date';
          }
        }
      });
    });
  }
  
  function closeAllSelect(element) {
    const items = document.querySelectorAll('.select-items');
    const selected = document.querySelectorAll('.select-selected');
    
    items.forEach((item, index) => {
      if(element !== selected[index]) {
        item.classList.add('select-hide');
      }
    });
    
    selected.forEach((sel, index) => {
      if(element !== sel) {
        sel.classList.remove('select-arrow-active');
      }
    });
  }
  
  // Close select when clicking outside
  document.addEventListener('click', function() {
    closeAllSelect();
  });
  
  // Initialize custom date picker
  let miniCalendarState = {
    currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    selectedDate: null
  };
  
  function initCustomDatePicker() {
    const datePickerEl = document.getElementById('customDatePicker');
    if(!datePickerEl) return;
    
    const dateSelected = document.getElementById('dateSelected');
    const dateDropdown = document.getElementById('dateDropdown');
    const dateText = document.getElementById('dateText');
    
    // Set initial text
    dateText.textContent = i18n[state.lang].selectDate;
    
    dateSelected.addEventListener('click', function(e) {
      e.stopPropagation();
      const wasHidden = dateDropdown.classList.contains('select-hide');
      closeAllSelect();
      if(wasHidden) {
        dateDropdown.classList.remove('select-hide');
        renderMiniCalendar();
      }
    });
    
    document.addEventListener('click', function(e) {
      if(!datePickerEl.contains(e.target)) {
        dateDropdown.classList.add('select-hide');
      }
    });
    
    // Mini calendar navigation
    const prevBtn = document.getElementById('miniPrevMonth');
    const nextBtn = document.getElementById('miniNextMonth');
    
    if(prevBtn) {
      prevBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        changeMiniMonth(-1);
      });
    }
    
    if(nextBtn) {
      nextBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        changeMiniMonth(1);
      });
    }
  }
  
  function changeMiniMonth(delta) {
    const d = new Date(miniCalendarState.currentMonth);
    d.setMonth(d.getMonth() + delta);
    miniCalendarState.currentMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    renderMiniCalendar();
  }
  
  function renderMiniCalendar() {
    const monthLabel = document.getElementById('miniMonthLabel');
    const grid = document.getElementById('miniCalendarGrid');
    
    if(!monthLabel || !grid) return;
    
    const month = miniCalendarState.currentMonth.getMonth();
    const year = miniCalendarState.currentMonth.getFullYear();
    
    monthLabel.textContent = `${i18n[state.lang].months[month]} ${year}`;
    
    const firstDayWeekIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    const todayISO = toISO(new Date());
    
    // Day headers
    const dayHeaders = state.lang === 'ru' 
      ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
      : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    
    dayHeaders.forEach(day => {
      cells.push(`<div class="mini-day-header">${day}</div>`);
    });
    
    for(let i = 0; i < firstDayWeekIndex; i++) {
      cells.push(`<div class="mini-day-cell muted"></div>`);
    }
    
    for(let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const iso = toISO(dateObj);
      const isSelected = miniCalendarState.selectedDate === iso;
      const isPast = iso < todayISO;
      
      if(isPast) {
        cells.push(`<div class="mini-day-cell muted past">${day}</div>`);
      } else {
        cells.push(`<button class="mini-day-cell ${isSelected ? 'selected' : ''}" data-date="${iso}">${day}</button>`);
      }
    }
    
    grid.innerHTML = cells.join('');
    
    // Add click handlers
    grid.querySelectorAll('.mini-day-cell[data-date]').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const dateISO = this.getAttribute('data-date');
        miniCalendarState.selectedDate = dateISO;
        
        // Update dateFilter value
        const dateFilter = document.getElementById('dateFilter');
        if(dateFilter) {
          dateFilter.value = dateISO;
        }
        
        // Update display text
        const dateText = document.getElementById('dateText');
        const date = new Date(dateISO + 'T00:00:00');
        const formatted = date.toLocaleDateString(state.lang === 'ru' ? 'ru-RU' : 'en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        dateText.textContent = formatted;
        
        // Close dropdown
        const dateDropdown = document.getElementById('dateDropdown');
        if(dateDropdown) {
          dateDropdown.classList.add('select-hide');
        }
        
        // Load bookings
        loadBookings();
      });
    });
  }

  function init(){
    applyTheme(state.theme); 
    applyLang(state.lang);
    
    // Set initial theme toggle state
    if(elements.themeToggle) {
      elements.themeToggle.checked = state.theme === 'dark';
    }
    
    // Initialize custom select
    initCustomSelect();
    
    // Initialize custom date picker
    initCustomDatePicker();
    
    // Check if already logged in
    if(getToken()) {
      state.isAdmin = true;
      switchView('admin');
    }
    
    // Event listeners
    elements.startBooking.addEventListener('click', () => switchView('booking'));
    elements.adminBtn.addEventListener('click', openLoginModal);
    elements.logoutBtn.addEventListener('click', logout);
    elements.closeModal.addEventListener('click', closeLoginModal);
    elements.loginForm.addEventListener('submit', handleLogin);
    elements.loginModal.addEventListener('click', (e) => {
      if(e.target === elements.loginModal) closeLoginModal();
    });
    
    elements.prevMonth.addEventListener('click', () => changeMonth(-1));
    elements.nextMonth.addEventListener('click', () => changeMonth(1));
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.bookingForm.addEventListener('submit', onSubmit);
    
    elements.nameInput.addEventListener('input', validateName);
    elements.phoneInput.addEventListener('input', handlePhoneInput);
    
    elements.clearFilter.addEventListener('click', () => { 
      const dateFilter = document.getElementById('dateFilter');
      if(dateFilter) {
        dateFilter.value = '';
      }
      miniCalendarState.selectedDate = null;
      const dateText = document.getElementById('dateText');
      if(dateText) {
        dateText.textContent = i18n[state.lang].selectDate;
      }
      loadBookings(); 
    });
    
    renderCalendar();
    renderSlots();
  }

  function switchView(view) {
    state.currentView = view;
    
    elements.welcomeSection.style.display = view === 'welcome' ? 'flex' : 'none';
    elements.bookingSection.style.display = view === 'booking' ? 'grid' : 'none';
    elements.adminSection.style.display = view === 'admin' ? 'block' : 'none';
    
    elements.adminBtn.style.display = state.isAdmin ? 'none' : 'inline-block';
    elements.logoutBtn.style.display = state.isAdmin ? 'inline-block' : 'none';
    
    if(view === 'admin') {
      loadBookings();
    }
  }

  function openLoginModal() {
    elements.loginModal.style.display = 'flex';
    elements.loginError.textContent = '';
  }

  function closeLoginModal() {
    elements.loginModal.style.display = 'none';
    elements.loginForm.reset();
    elements.loginError.textContent = '';
  }

  async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(elements.loginForm);
    const username = formData.get('username');
    const password = formData.get('password');
    
    try {
      const res = await fetch('/api/auth/login', { 
        method:'POST', 
        headers:{ 'Content-Type':'application/json' }, 
        body: JSON.stringify({ username, password })
      });
      
      if(!res.ok) {
        elements.loginError.textContent = i18n[state.lang].loginFailed;
        return;
      }
      
      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.token);
      state.isAdmin = true;
      closeLoginModal();
      switchView('admin');
    } catch(err) {
      elements.loginError.textContent = i18n[state.lang].loginFailed;
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    state.isAdmin = false;
    switchView('welcome');
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  function authHeader() {
    const token = getToken();
    return token ? { 'Authorization': 'Bearer ' + token } : {};
  }

  async function loadBookings() {
    if(!state.isAdmin) return;
    
    const dateFilterEl = document.getElementById('dateFilter');
    const filterValue = dateFilterEl ? dateFilterEl.value : '';
    const params = filterValue ? ('?date='+encodeURIComponent(filterValue)) : '';
    
    try {
      const res = await fetch('/api/admin/bookings'+params, { headers: authHeader() });
      
      if(res.status === 401) {
        logout();
        return;
      }
      
      const data = await res.json();
      renderBookingsList(data.items || []);
    } catch(err) {
      console.error('Failed to load bookings:', err);
    }
  }

  function renderBookingsList(items) {
    if(items.length === 0) {
      elements.bookingsList.innerHTML = `<div class="empty-state">${i18n[state.lang].emptyBookings}</div>`;
      return;
    }
    
    elements.bookingsList.innerHTML = items.map(item => {
      const statusClass = item.status === 'approved' ? 'approved' : item.status === 'rejected' ? 'rejected' : 'pending';
      const statusText = item.status === 'approved' ? i18n[state.lang].approved : item.status === 'rejected' ? i18n[state.lang].rejected : i18n[state.lang].pending;
      
      return `<div class="booking-item">
        <div class="booking-info">
          <div class="booking-date">${item.date} • ${item.time}</div>
          <div class="booking-contact">${item.name} • ${item.phone}</div>
        </div>
        <div class="booking-actions">
          <span class="badge ${statusClass}">${statusText}</span>
          ${item.status === 'pending' ? `
            <button class="btn-approve" data-id="${item.id}">${i18n[state.lang].approve}</button>
            <button class="btn-reject" data-id="${item.id}">${i18n[state.lang].reject}</button>
          ` : ''}
        </div>
      </div>`;
    }).join('');
    
    elements.bookingsList.querySelectorAll('.btn-approve').forEach(btn => {
      btn.addEventListener('click', () => approveBooking(btn.getAttribute('data-id')));
    });
    
    elements.bookingsList.querySelectorAll('.btn-reject').forEach(btn => {
      btn.addEventListener('click', () => rejectBooking(btn.getAttribute('data-id')));
    });
  }

  async function approveBooking(id) {
    try {
      const res = await fetch(`/api/admin/bookings/${id}/approve`, { 
        method:'PATCH', 
        headers: authHeader() 
      });
      
      if(!res.ok) {
        showToast(i18n[state.lang].approveError);
        return;
      }
      
      loadBookings();
    } catch(err) {
      showToast(i18n[state.lang].approveError);
    }
  }

  async function rejectBooking(id) {
    try {
      const res = await fetch(`/api/admin/bookings/${id}/reject`, { 
        method:'PATCH', 
        headers: authHeader() 
      });
      
      if(!res.ok) {
        showToast(i18n[state.lang].rejectError);
        return;
      }
      
      loadBookings();
    } catch(err) {
      showToast(i18n[state.lang].rejectError);
    }
  }

  function validateName() {
    const value = elements.nameInput.value.trim();
    const isValid = /^[a-zA-Zа-яА-ЯёЁ\s\-']*$/.test(value);
    
    if(!isValid && value) {
      elements.nameError.textContent = i18n[state.lang].invalidName;
      elements.nameInput.classList.add('error');
    } else {
      elements.nameError.textContent = '';
      elements.nameInput.classList.remove('error');
    }
    
    return isValid;
  }

  function formatPhoneNumber(value) {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format for Russian phone numbers: +7 (XXX) XXX-XX-XX
    if(digits.length === 0) return '';
    
    let formatted = '+7';
    if(digits.length > 1) {
      const phoneDigits = digits.substring(1); // Remove first digit (assumed to be 7 or 8)
      
      if(phoneDigits.length > 0) {
        formatted += ' (' + phoneDigits.substring(0, 3);
      }
      if(phoneDigits.length >= 3) {
        formatted += ') ' + phoneDigits.substring(3, 6);
      }
      if(phoneDigits.length >= 6) {
        formatted += '-' + phoneDigits.substring(6, 8);
      }
      if(phoneDigits.length >= 8) {
        formatted += '-' + phoneDigits.substring(8, 10);
      }
    }
    
    return formatted;
  }

  function handlePhoneInput(e) {
    const input = e.target;
    const cursorPosition = input.selectionStart;
    const oldValue = input.value;
    const oldLength = oldValue.length;
    
    // Format the value
    const formatted = formatPhoneNumber(input.value);
    input.value = formatted;
    
    // Adjust cursor position
    const newLength = formatted.length;
    const diff = newLength - oldLength;
    
    if(cursorPosition) {
      input.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
    }
    
    validatePhone();
  }

  function validatePhone() {
    const value = elements.phoneInput.value.trim();
    const digitsOnly = value.replace(/\D/g, '');
    const isValid = digitsOnly.length === 0 || digitsOnly.length >= 11;
    
    if(!isValid && value) {
      elements.phoneError.textContent = i18n[state.lang].invalidPhone;
      elements.phoneInput.classList.add('error');
    } else {
      elements.phoneError.textContent = '';
      elements.phoneInput.classList.remove('error');
    }
    
    return isValid;
  }

  
  function toggleTheme(e){ 
    state.theme = e.target.checked ? 'dark' : 'light'; 
    localStorage.setItem('theme', state.theme); 
    applyTheme(state.theme); 
  }
  
  function applyTheme(theme){ 
    document.documentElement.classList.toggle('light', theme === 'light'); 
  }
  
  function applyLang(lang){ 
    document.querySelectorAll('[data-i18n]').forEach(n=>{ 
      const key=n.getAttribute('data-i18n'); 
      const v=i18n[lang][key]; 
      if(!v) return; 
      if(n.tagName==='INPUT'||n.tagName==='TEXTAREA'){ 
        n.setAttribute('placeholder', v);
      } else { 
        n.textContent=v; 
      } 
    }); 
  }

  function changeMonth(delta){ 
    const d = new Date(state.currentMonth); 
    d.setMonth(d.getMonth()+delta); 
    state.currentMonth = new Date(d.getFullYear(), d.getMonth(), 1); 
    renderCalendar(); 
  }

  function renderCalendar(){
    const month = state.currentMonth.getMonth(); 
    const year = state.currentMonth.getFullYear(); 
    elements.monthLabel.textContent = `${i18n[state.lang].months[month]} ${year}`;
    const firstDayWeekIndex = (new Date(year, month, 1).getDay() + 6) % 7; 
    const daysInMonth = new Date(year, month + 1, 0).getDate(); 
    const cells = [];
    const todayISO = toISO(new Date());
    
    for(let i=0;i<firstDayWeekIndex;i++){ 
      cells.push(`<div class="day-cell muted"></div>`); 
    }
    
    for(let day=1; day<=daysInMonth; day++){
      const iso = toISO(new Date(year, month, day));
      const isSelected = state.selectedDateISO === iso;
      const isPast = iso < todayISO;
      
      if(isPast){
        cells.push(`<div class="day-cell muted past">${day}</div>`);
      } else {
        cells.push(`<button class="day-cell ${isSelected? 'selected':''}\" data-iso=\"${iso}\">${day}</button>`);
      }
    }
    
    elements.calendarGrid.innerHTML = cells.join('');
    elements.calendarGrid.querySelectorAll('.day-cell[data-iso]').forEach(btn => { 
      btn.addEventListener('click', async () => { 
        state.selectedDateISO = btn.getAttribute('data-iso'); 
        state.selectedTime = null; 
        updateSelectedLabel(); 
        await ensureAvailability(state.selectedDateISO); 
        renderCalendar(); 
        renderSlots(); 
      }); 
    });
  }

  async function ensureAvailability(dateISO){ 
    if(!dateISO) return; 
    const res = await fetch(`/api/availability?date=${encodeURIComponent(dateISO)}`); 
    if(res.ok){ 
      const data=await res.json(); 
      state.availabilityCache[dateISO]=data.slots; 
    } 
  }

  function renderSlots(){
    const all = generateSlots(state.workday.start, state.workday.end, 30);
    const middleIndex = all.findIndex(t => timeToMinutes(t) >= 15*60);
    const day = all.slice(0, Math.max(0, middleIndex)); 
    const eve = all.slice(Math.max(0, middleIndex));
    renderSlotList(elements.daySlots, day); 
    renderSlotList(elements.eveningSlots, eve);
  }

  function renderSlotList(container, times){
    const date = state.selectedDateISO; 
    const avail = date ? (state.availabilityCache[date] || []) : [];
    
    container.innerHTML = times.map(t => {
      const info = avail.find(s=>s.time===t) || { capacity: 6, booked: 0, full: false };
      const remaining = Math.max(0, (info.capacity||6) - (info.booked||0));
      const full = !!info.full || remaining === 0;
      const label = full ? `${t} · ${i18n[state.lang].full}` : `${t} · ${remaining}`;
      const isSelected = state.selectedTime === t; 
      const disabled = !date || full;
      
      return `<button class="slot ${full? 'full':''} ${isSelected? 'selected':''}\" data-time=\"${t}\" ${disabled? 'disabled':''}>${label}</button>`;
    }).join('');
    
    container.querySelectorAll('.slot').forEach(btn => { 
      btn.addEventListener('click', () => { 
        if(!state.selectedDateISO) return; 
        state.selectedTime = btn.getAttribute('data-time'); 
        updateSelectedLabel(); 
        elements.submitBtn.disabled = false; 
        renderSlots(); 
      }); 
    });
  }

  function updateSelectedLabel(){ 
    if(state.selectedDateISO && state.selectedTime){ 
      const d = new Date(state.selectedDateISO); 
      const fmt = d.toLocaleDateString(state.lang==='ru'?'ru-RU':'en-GB',{ day:'2-digit', month:'2-digit', year:'numeric' }); 
      elements.selectedSlot.textContent = `${fmt} • ${state.selectedTime}`; 
    } else { 
      elements.selectedSlot.textContent = i18n[state.lang].noSlot; 
      elements.submitBtn.disabled = true; 
    } 
  }

  async function onSubmit(e){ 
    e.preventDefault(); 
    
    if(!state.selectedDateISO || !state.selectedTime) return; 
    
    const formData = new FormData(elements.bookingForm); 
    const name=(formData.get('name')||'').toString().trim(); 
    const phone=(formData.get('phone')||'').toString().trim(); 
    
    if(!name||!phone) return;
    
    // Validate before submit
    if(!validateName() || !validatePhone()) {
      showToast(i18n[state.lang].validationError);
      return;
    }
    
    try {
      const res = await fetch('/api/bookings', { 
        method:'POST', 
        headers:{ 'Content-Type':'application/json' }, 
        body: JSON.stringify({ date: state.selectedDateISO, time: state.selectedTime, name, phone }) 
      });
      
      if(res.status === 400) {
        const error = await res.json();
        if(error.error === 'invalid_name') {
          showToast(i18n[state.lang].invalidName);
        } else if(error.error === 'invalid_phone') {
          showToast(i18n[state.lang].invalidPhone);
        } else {
          showToast(i18n[state.lang].validationError);
        }
        return;
      }
      
      if(res.status===409){ 
        showToast(i18n[state.lang].booked); 
        await ensureAvailability(state.selectedDateISO); 
        renderSlots(); 
        return; 
      }
      
      if(!res.ok){ 
        showToast(i18n[state.lang].error); 
        return; 
      }
      
      elements.bookingForm.reset(); 
      showToast(i18n[state.lang].success); 
      state.selectedTime=null; 
      await ensureAvailability(state.selectedDateISO); 
      renderSlots(); 
      updateSelectedLabel();
    } catch(err) {
      showToast(i18n[state.lang].connectionError);
    }
  }

  // Helpers
  function generateSlots(start, end, stepMinutes){ 
    const slots=[]; 
    let m=timeToMinutes(start); 
    const endM=timeToMinutes(end); 
    while(m<=endM){ 
      slots.push(minutesToTime(m)); 
      m+=stepMinutes;
    } 
    return slots; 
  }
  
  function timeToMinutes(t){ 
    const [h,mi]=t.split(':').map(Number); 
    return h*60+mi; 
  }
  
  function minutesToTime(m){ 
    return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`; 
  }
  
  function toISO(d){ 
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString().slice(0,10); 
  }

  function showToast(text){ 
    if(!elements.toast) return; 
    elements.toast.textContent = text; 
    elements.toast.classList.add('show'); 
    setTimeout(()=>elements.toast.classList.remove('show'), 2500); 
  }

  init();
})();
