(function(){
  const TOKEN_KEY = 'admin_token';
  
  const state = {
    currentMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    selectedDateISO: null,
    selectedTime: null,
    selectedClinicId: null,
    clinics: [],
    adminClinicFilter: null,
    statsClinicFilter: null,
    statsPeriod: 'all',
    lang: localStorage.getItem('lang') || 'ru',
    theme: 'light', // Всегда открывается светлая тема
    workday: { start: '09:00', end: '18:30' },
    availabilityCache: {},
    isAdmin: false,
    currentView: 'welcome', // welcome | booking | admin
  };

  const i18n = {
    ru: { 
      day:'День', evening:'Вечер', formTitle:'Запись на прием', name:'Имя', phone:'Телефон', 
      clinic:'Выберите клинику', selectClinic:'Выберите клинику', clinicNotSelected:'Клиника не выбрана',
      noSlot:'Выберите дату и время', book:'Записаться', success:'Вы записаны на прием!', 
      booked:'Забронировано', months:['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'], 
      privacy:'Отправляя заявку, вы соглашаетесь с обработкой персональных данных', full:'Занято',
      welcomeTitle: 'Добро пожаловать!',
      welcomeText: 'Запишитесь на медицинский осмотр',
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
      attended: 'Пришел',
      notAttended: 'Не пришел',
      markAttended: 'Пришел',
      markNotAttended: 'Не пришел',
      selectDate: 'Выбрать дату',
      bookings: 'Записи',
      statistics: 'Статистика',
      totalBookings: 'Всего записей',
      attendedCount: 'Пришли',
      notAttendedCount: 'Не пришли',
      pendingCount: 'Ожидают',
      filterDay: 'День',
      filterWeek: 'Неделя',
      filterMonth: 'Месяц',
      filterYear: 'Год',
      filterAll: 'Все время'
    },
    en: { 
      day:'Day', evening:'Evening', formTitle:'Book an appointment', name:'Name', phone:'Phone', 
      clinic:'Select clinic', selectClinic:'Select clinic', clinicNotSelected:'Clinic not selected',
      noSlot:'Select date and time', book:'Book', success:'You are booked for an appointment!', 
      booked:'Booked', months:['January','February','March','April','May','June','July','August','September','October','November','December'], 
      privacy:'By submitting you agree to the Privacy Policy', full:'Full',
      welcomeTitle: 'Welcome!',
      welcomeText: 'Book a medical examination',
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
      attended: 'Attended',
      notAttended: 'Not Attended',
      markAttended: 'Attended',
      markNotAttended: 'Not Attended',
      selectDate: 'Select date',
      bookings: 'Bookings',
      statistics: 'Statistics',
      totalBookings: 'Total Bookings',
      attendedCount: 'Attended',
      notAttendedCount: 'Not Attended',
      pendingCount: 'Pending',
      filterDay: 'Day',
      filterWeek: 'Week',
      filterMonth: 'Month',
      filterYear: 'Year',
      filterAll: 'All Time'
    },
    uz: { 
      day:'Kun', evening:'Kechqurun', formTitle:'Qabulga yozilish', name:'Ism', phone:'Telefon', 
      clinic:'Klinikani tanlang', selectClinic:'Klinikani tanlang', clinicNotSelected:'Klinika tanlanmagan',
      noSlot:'Sana va vaqtni tanlang', book:'Yozilish', success:'Siz qabulga yozildingiz!', 
      booked:'Band qilingan', months:['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'], 
      privacy:'Arizani yuborish orqali siz shaxsiy ma\'lumotlarni qayta ishlashga rozilik bildirasiz', full:'Band',
      welcomeTitle: 'Xush kelibsiz!',
      welcomeText: 'Tibbiy ko\'rikdan o\'tish uchun yoziling',
      startBooking: 'Yozilishni boshlash',
      adminLogin: 'Admin paneliga kirish',
      username: 'Login',
      password: 'Parol',
      login: 'Kirish',
      invalidName: 'Ism faqat harflardan iborat bo\'lishi kerak',
      invalidPhone: 'Telefon raqami noto\'g\'ri',
      loginFailed: 'Noto\'g\'ri login yoki parol',
      error: 'Xatolik',
      connectionError: 'Ulanish xatosi',
      validationError: 'Tekshirish xatosi',
      emptyBookings: 'Arizalar yo\'q',
      pending: 'Kutilmoqda',
      attended: 'Keldi',
      notAttended: 'Kelmadi',
      markAttended: 'Keldi',
      markNotAttended: 'Kelmadi',
      selectDate: 'Sanani tanlang',
      bookings: 'Arizalar',
      statistics: 'Statistika',
      totalBookings: 'Jami arizalar',
      attendedCount: 'Kelganlar',
      notAttendedCount: 'Kelmaganlar',
      pendingCount: 'Kutilmoqda',
      filterDay: 'Kun',
      filterWeek: 'Hafta',
      filterMonth: 'Oy',
      filterYear: 'Yil',
      filterAll: 'Barcha vaqt'
    },
    tj: { 
      day:'Рӯз', evening:'Бегоҳ', formTitle:'Ба қабул ном навис', name:'Ном', phone:'Телефон', 
      clinic:'Клиниканро интихоб кунед', selectClinic:'Клиниканро интихоб кунед', clinicNotSelected:'Клиника интихоб нашудааст',
      noSlot:'Сана ва вақтро интихоб кунед', book:'Ном навис', success:'Шумо ба қабул ном навишта шудед!', 
      booked:'Банд', months:['Январ','Феврал','Март','Апрел','Май','Июн','Июл','Август','Сентябр','Октябр','Ноябр','Декабр'], 
      privacy:'Бо фиристодани дархост шумо розӣ мешавед, ки маълумоти шахсии худро коркард кунед', full:'Банд',
      welcomeTitle: 'Хуш омадед!',
      welcomeText: 'Барои санҷиши тиббӣ ном нависед',
      startBooking: 'Ном нависиро оғоз кунед',
      adminLogin: 'Воридшавӣ ба панели админ',
      username: 'Логин',
      password: 'Рамз',
      login: 'Ворид шудан',
      invalidName: 'Ном бояд танҳо аз ҳарфҳо иборат бошад',
      invalidPhone: 'Рақами телефон нодуруст аст',
      loginFailed: 'Логин ё рамз нодуруст аст',
      error: 'Хатогӣ',
      connectionError: 'Хатогии алоқа',
      validationError: 'Хатогии тафтиш',
      emptyBookings: 'Дархостҳо нестанд',
      pending: 'Интизор',
      attended: 'Омад',
      notAttended: 'Наомад',
      markAttended: 'Омад',
      markNotAttended: 'Наомад',
      selectDate: 'Интихоби сана',
      bookings: 'Дархостҳо',
      statistics: 'Омор',
      totalBookings: 'Ҳамаги дархостҳо',
      attendedCount: 'Омаданд',
      notAttendedCount: 'Наомаданд',
      pendingCount: 'Интизоранд',
      filterDay: 'Рӯз',
      filterWeek: 'Ҳафта',
      filterMonth: 'Моҳ',
      filterYear: 'Сол',
      filterAll: 'Ҳамаи вақт'
    },
    kg: { 
      day:'Күндүз', evening:'Кеч', formTitle:'Кабылга жазылуу', name:'Аты-жөнү', phone:'Телефон', 
      clinic:'Клиниканы тандаңыз', selectClinic:'Клиниканы тандаңыз', clinicNotSelected:'Клиника тандалган эмес',
      noSlot:'Датаны жана убакытты тандаңыз', book:'Жазылуу', success:'Сиз кабылга жазылдыңыз!', 
      booked:'Брондолгон', months:['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'], 
      privacy:'Арызды жөнөтүү менен сиз жеке маалыматтарды иштетүүгө макул болосуз', full:'Бош эмес',
      welcomeTitle: 'Кош келиңиз!',
      welcomeText: 'Медициналык кароодон өтүү үчүн жазылыңыз',
      startBooking: 'Жазылууну баштоо',
      adminLogin: 'Админ панелине кирүү',
      username: 'Логин',
      password: 'Сыр сөз',
      login: 'Кирүү',
      invalidName: 'Аты-жөнү тамгалардан гана турушу керек',
      invalidPhone: 'Туура эмес телефон номери',
      loginFailed: 'Туура эмес логин же сыр сөз',
      error: 'Ката',
      connectionError: 'Байланыш катасы',
      validationError: 'Текшерүү катасы',
      emptyBookings: 'Арыздар жок',
      pending: 'Күтүүдө',
      attended: 'Келди',
      notAttended: 'Келген жок',
      markAttended: 'Келди',
      markNotAttended: 'Келген жок',
      selectDate: 'Датаны тандоо',
      bookings: 'Арыздар',
      statistics: 'Статистика',
      totalBookings: 'Бардык арыздар',
      attendedCount: 'Келишти',
      notAttendedCount: 'Келишкен жок',
      pendingCount: 'Күтүүдө',
      filterDay: 'Күн',
      filterWeek: 'Апта',
      filterMonth: 'Ай',
      filterYear: 'Жыл',
      filterAll: 'Бардык убакыт'
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
    customClinicSelect: document.getElementById('customClinicSelect'),
    clinicSelectItems: document.getElementById('clinicSelectItems'),
    clinicError: document.getElementById('clinicError'),
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
    const langMap = { ru: 'RU', en: 'EN', uz: 'UZ', tj: 'TJ', kg: 'KG' };
    selected.textContent = langMap[state.lang] || 'RU';
    
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
          if(dateText && dateText.textContent !== i18n[state.lang].selectDate) {
            dateText.textContent = i18n[state.lang].selectDate;
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
        const localeMap = { ru: 'ru-RU', en: 'en-GB', uz: 'uz-UZ', tj: 'ru-RU', kg: 'ru-RU' };
        const formatted = date.toLocaleDateString(localeMap[state.lang] || 'ru-RU', {
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

  async function loadClinics(){
    try {
      const res = await fetch('/api/clinics');
      if(!res.ok) {
        console.error('Failed to load clinics, status:', res.status);
        throw new Error('Failed to load clinics: ' + res.status);
      }
      const data = await res.json();
      state.clinics = data.items || [];
      
      // Populate custom clinic select
      elements.clinicSelectItems.innerHTML = '';
      state.clinics.forEach(clinic => {
        const div = document.createElement('div');
        div.setAttribute('data-value', clinic.id);
        div.setAttribute('data-name', clinic.name);
        div.textContent = clinic.name;
        elements.clinicSelectItems.appendChild(div);
      });
      
      // Populate admin clinic filter
      const clinicFilterItems = document.getElementById('clinicFilterItems');
      if(clinicFilterItems) {
        clinicFilterItems.innerHTML = '<div data-value="">Все клиники</div>';
        state.clinics.forEach(clinic => {
          const div = document.createElement('div');
          div.setAttribute('data-value', clinic.id);
          div.textContent = clinic.name;
          clinicFilterItems.appendChild(div);
        });
        initClinicFilterSelect();
      }

      // Populate stats clinic filter
      const statsClinicFilterItems = document.getElementById('statsClinicFilterItems');
      if(statsClinicFilterItems) {
        statsClinicFilterItems.innerHTML = '<div data-value="">Все клиники</div>';
        state.clinics.forEach(clinic => {
          const div = document.createElement('div');
          div.setAttribute('data-value', clinic.id);
          div.textContent = clinic.name;
          statsClinicFilterItems.appendChild(div);
        });
        initStatsClinicFilterSelect();
      }
      
      // Initialize custom clinic select after items are loaded
      initClinicSelect();
    } catch(err) {
      console.error('Failed to load clinics:', err);
      showToast('Не удалось загрузить список клиник. Перезагрузите страницу.');
    }
  }
  
  function initClinicFilterSelect() {
    const selectElement = document.getElementById('customClinicFilter');
    if(!selectElement) return;
    
    const selected = selectElement.querySelector('.select-selected');
    const items = document.getElementById('clinicFilterItems');
    const options = items.querySelectorAll('div');
    
    selected.addEventListener('click', function(e) {
      e.stopPropagation();
      closeAllSelect(this);
      items.classList.toggle('select-hide');
      this.classList.toggle('select-arrow-active');
    });
    
    options.forEach(option => {
      option.addEventListener('click', function(e) {
        e.stopPropagation();
        const clinicId = this.getAttribute('data-value');
        selected.textContent = this.textContent;
        items.classList.add('select-hide');
        selected.classList.remove('select-arrow-active');
        
        // Update filter
        state.adminClinicFilter = clinicId ? Number(clinicId) : null;
        loadBookings();
      });
    });
  }

  function initStatsClinicFilterSelect() {
    const selectElement = document.getElementById('customStatsClinicFilter');
    if(!selectElement) return;
    
    const selected = selectElement.querySelector('.select-selected');
    const items = document.getElementById('statsClinicFilterItems');
    const options = items.querySelectorAll('div');
    
    selected.addEventListener('click', function(e) {
      e.stopPropagation();
      closeAllSelect(this);
      items.classList.toggle('select-hide');
      this.classList.toggle('select-arrow-active');
    });
    
    options.forEach(option => {
      option.addEventListener('click', function(e) {
        e.stopPropagation();
        const clinicId = this.getAttribute('data-value');
        selected.textContent = this.textContent;
        items.classList.add('select-hide');
        selected.classList.remove('select-arrow-active');
        
        // Update filter
        state.statsClinicFilter = clinicId ? Number(clinicId) : null;
        loadStatistics(state.statsPeriod);
      });
    });
  }
  
  function initClinicSelect() {
    const selectElement = elements.customClinicSelect;
    if(!selectElement) return;
    
    const selected = selectElement.querySelector('.select-selected');
    const items = elements.clinicSelectItems;
    const options = items.querySelectorAll('div');
    
    selected.addEventListener('click', function(e) {
      e.stopPropagation();
      closeAllSelect(this);
      items.classList.toggle('select-hide');
      this.classList.toggle('select-arrow-active');
    });
    
    options.forEach(option => {
      option.addEventListener('click', async function(e) {
        e.stopPropagation();
        const clinicId = this.getAttribute('data-value');
        const clinicName = this.getAttribute('data-name');
        selected.textContent = clinicName;
        items.classList.add('select-hide');
        selected.classList.remove('select-arrow-active');
        
        // Update selected clinic
        state.selectedClinicId = Number(clinicId);
        state.availabilityCache = {};
        
        // Clear clinic validation error
        if(elements.clinicError) {
          elements.clinicError.textContent = '';
        }
        elements.customClinicSelect.classList.remove('error');
        
        // Preload month availability to show full days in calendar
        await preloadMonthAvailability();
        
        // Reload slots if date already selected
        if(state.selectedDateISO && state.selectedClinicId){
          await ensureAvailability(state.selectedDateISO);
          renderSlots();
        }
      });
    });
  }

  function init(){
    // Удаляем сохраненную тему, чтобы всегда открывалась светлая
    localStorage.removeItem('theme');
    
    applyTheme(state.theme); 
    applyLang(state.lang);
    
    // Set initial theme toggle state (всегда false для светлой темы)
    if(elements.themeToggle) {
      elements.themeToggle.checked = false;
    }
    
    // Initialize custom select
    initCustomSelect();
    
    // Initialize custom date picker
    initCustomDatePicker();
    
    // Load clinics
    loadClinics();
    
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
    
    // Toggle password visibility
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    if(togglePasswordBtn && passwordInput) {
      togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle SVG icons
        const eyeOpen = togglePasswordBtn.querySelectorAll('.eye-open');
        const eyeClosed = togglePasswordBtn.querySelectorAll('.eye-closed');
        
        if(type === 'password') {
          eyeOpen.forEach(el => el.style.display = '');
          eyeClosed.forEach(el => el.style.display = 'none');
          togglePasswordBtn.setAttribute('aria-label', 'Показать пароль');
        } else {
          eyeOpen.forEach(el => el.style.display = 'none');
          eyeClosed.forEach(el => el.style.display = '');
          togglePasswordBtn.setAttribute('aria-label', 'Скрыть пароль');
        }
      });
    }
    
    elements.prevMonth.addEventListener('click', async () => await changeMonth(-1));
    elements.nextMonth.addEventListener('click', async () => await changeMonth(1));
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
      // Reset clinic filter
      state.adminClinicFilter = null;
      const clinicFilterSelected = document.querySelector('#customClinicFilter .select-selected');
      if(clinicFilterSelected) {
        clinicFilterSelected.textContent = 'Все клиники';
      }
      loadBookings(); 
    });

    // Admin tab switching
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        switchAdminTab(tab.getAttribute('data-tab'));
      });
    });

    // Statistics filters
    document.querySelectorAll('.stats-filter').forEach(filter => {
      filter.addEventListener('click', () => {
        document.querySelectorAll('.stats-filter').forEach(f => f.classList.remove('active'));
        filter.classList.add('active');
        loadStatistics(filter.getAttribute('data-period'));
      });
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
      let items = data.items || [];
      
      // Apply clinic filter
      if(state.adminClinicFilter) {
        items = items.filter(item => item.clinic && item.clinic.id === state.adminClinicFilter);
      }
      
      renderBookingsList(items);
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
      const statusClass = item.status === 'attended' ? 'approved' : item.status === 'not_attended' ? 'rejected' : 'pending';
      const statusText = item.status === 'attended' ? i18n[state.lang].attended : item.status === 'not_attended' ? i18n[state.lang].notAttended : i18n[state.lang].pending;
      const clinicName = item.clinic ? item.clinic.name : 'N/A';
      const timeRange = getTimeRange(item.time);
      
      return `<div class="booking-item">
        <div class="booking-info">
          <div class="booking-date">${item.date} • ${timeRange}</div>
          <div class="booking-contact">${item.name} • ${item.phone}</div>
          <div class="booking-clinic">${clinicName}</div>
        </div>
        <div class="booking-actions">
          <span class="badge ${statusClass}">${statusText}</span>
          ${item.status === 'pending' ? `
            <button class="btn-approve" data-id="${item.id}">${i18n[state.lang].markAttended}</button>
            <button class="btn-reject" data-id="${item.id}">${i18n[state.lang].markNotAttended}</button>
          ` : ''}
        </div>
      </div>`;
    }).join('');
    
    elements.bookingsList.querySelectorAll('.btn-approve').forEach(btn => {
      btn.addEventListener('click', () => markAttended(btn.getAttribute('data-id')));
    });
    
    elements.bookingsList.querySelectorAll('.btn-reject').forEach(btn => {
      btn.addEventListener('click', () => markNotAttended(btn.getAttribute('data-id')));
    });
  }

  async function markAttended(id) {
    try {
      const res = await fetch(`/api/admin/bookings/${id}/attended`, { 
        method:'PATCH', 
        headers: authHeader() 
      });
      
      if(!res.ok) {
        showToast(i18n[state.lang].error);
        return;
      }
      
      showToast('Отмечено: пришел');
      loadBookings();
    } catch(err) {
      showToast(i18n[state.lang].connectionError);
    }
  }

  async function markNotAttended(id) {
    try {
      const res = await fetch(`/api/admin/bookings/${id}/not-attended`, { 
        method:'PATCH', 
        headers: authHeader() 
      });
      
      if(!res.ok) {
        showToast(i18n[state.lang].error);
        return;
      }
      
      showToast('Отмечено: не пришел');
      loadBookings();
    } catch(err) {
      showToast(i18n[state.lang].connectionError);
    }
  }

  // Admin Tabs
  function switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    });
    
    if(tabName === 'statistics') {
      loadStatistics('all');
    }
  }

  // Statistics
  async function loadStatistics(period) {
    state.statsPeriod = period;
    try {
      let url = `/api/admin/statistics?period=${period}`;
      if(state.statsClinicFilter) {
        url += `&clinicId=${state.statsClinicFilter}`;
      }
      const res = await fetch(url, { headers: authHeader() });
      if(res.ok) {
        const data = await res.json();
        document.getElementById('statTotal').textContent = data.total;
        document.getElementById('statAttended').textContent = data.attended;
        document.getElementById('statNotAttended').textContent = data.notAttended;
        document.getElementById('statPending').textContent = data.pending;
      }
    } catch(err) {
      console.error('Failed to load statistics:', err);
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

  function validateClinic() {
    const isValid = !!state.selectedClinicId;
    
    if(!isValid) {
      elements.clinicError.textContent = i18n[state.lang].clinicNotSelected;
      elements.customClinicSelect.classList.add('error');
    } else {
      elements.clinicError.textContent = '';
      elements.customClinicSelect.classList.remove('error');
    }
    
    return isValid;
  }

  
  function toggleTheme(e){ 
    state.theme = e.target.checked ? 'dark' : 'light'; 
    // Не сохраняем тему в localStorage - всегда открывается светлая
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

  async function changeMonth(delta){ 
    const d = new Date(state.currentMonth); 
    d.setMonth(d.getMonth()+delta); 
    state.currentMonth = new Date(d.getFullYear(), d.getMonth(), 1); 
    await preloadMonthAvailability();
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
      
      // Check if all slots are full for this day
      const dayAvailability = state.availabilityCache[iso];
      const isFullDay = dayAvailability && dayAvailability.every(slot => slot.full);
      
      if(isPast){
        cells.push(`<div class="day-cell muted past">${day}</div>`);
      } else {
        const fullClass = isFullDay ? 'full-day' : '';
        cells.push(`<button class="day-cell ${isSelected? 'selected':''} ${fullClass}" data-iso="${iso}">${day}</button>`);
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
    if(!dateISO || !state.selectedClinicId) return; 
    const res = await fetch(`/api/availability?date=${encodeURIComponent(dateISO)}&clinicId=${state.selectedClinicId}`); 
    if(res.ok){ 
      const data=await res.json(); 
      state.availabilityCache[dateISO]=data.slots; 
    } 
  }

  async function preloadMonthAvailability() {
    if(!state.selectedClinicId) return;
    
    const month = state.currentMonth.getMonth(); 
    const year = state.currentMonth.getFullYear(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayISO = toISO(new Date());
    
    // Load availability for all future dates in current month
    const promises = [];
    for(let day = 1; day <= daysInMonth; day++) {
      const iso = toISO(new Date(year, month, day));
      if(iso >= todayISO && !state.availabilityCache[iso]) {
        promises.push(ensureAvailability(iso));
      }
    }
    
    await Promise.all(promises);
    renderCalendar();
  }

  function renderSlots(){
    const all = generateSlots(state.workday.start, state.workday.end, 30);
    const middleIndex = all.findIndex(t => timeToMinutes(t) >= 15*60);
    const day = all.slice(0, Math.max(0, middleIndex)); 
    const eve = all.slice(Math.max(0, middleIndex));
    renderSlotList(elements.daySlots, day); 
    renderSlotList(elements.eveningSlots, eve);
  }

  function getTimeRange(startTime) {
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m;
    const endMinutes = totalMinutes + 30;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    return `${startTime}-${endTime}`;
  }

  function renderSlotList(container, times){
    const date = state.selectedDateISO; 
    const avail = date ? (state.availabilityCache[date] || []) : [];
    
    container.innerHTML = times.map(t => {
      const info = avail.find(s=>s.time===t) || { capacity: 5, booked: 0, full: false };
      const remaining = Math.max(0, (info.capacity||5) - (info.booked||0));
      const full = !!info.full || remaining === 0;
      const timeRange = getTimeRange(t);
      const label = full ? `${timeRange} · ${i18n[state.lang].full}` : `${timeRange} · ${remaining}`;
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
      const localeMap = { ru: 'ru-RU', en: 'en-GB', uz: 'uz-UZ', tj: 'ru-RU', kg: 'ru-RU' };
      const fmt = d.toLocaleDateString(localeMap[state.lang] || 'ru-RU',{ day:'2-digit', month:'2-digit', year:'numeric' }); 
      const timeRange = getTimeRange(state.selectedTime);
      elements.selectedSlot.textContent = `${fmt} • ${timeRange}`; 
      elements.selectedSlot.classList.add('has-selection');
    } else { 
      elements.selectedSlot.textContent = i18n[state.lang].noSlot; 
      elements.selectedSlot.classList.remove('has-selection');
      elements.submitBtn.disabled = true; 
    } 
  }

  async function onSubmit(e){ 
    e.preventDefault(); 
    
    // Validate clinic first
    if(!validateClinic()) {
      showToast(i18n[state.lang].clinicNotSelected);
      return;
    }
    
    if(!state.selectedDateISO || !state.selectedTime || !state.selectedClinicId) return; 
    
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
        body: JSON.stringify({ date: state.selectedDateISO, time: state.selectedTime, name, phone, clinicId: state.selectedClinicId }) 
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
      
      const result = await res.json();
      const bookingId = result.bookingId || result.id;
      
      elements.bookingForm.reset(); 
      showToast(i18n[state.lang].success); 
      state.selectedTime=null; 
      await ensureAvailability(state.selectedDateISO); 
      renderSlots(); 
      updateSelectedLabel();
      
      // Download PDF
      if(bookingId) {
        setTimeout(() => {
          downloadBookingPDF(bookingId);
        }, 1000);
      }
    } catch(err) {
      showToast(i18n[state.lang].connectionError);
    }
  }

  // Download PDF
  function downloadBookingPDF(bookingId) {
    const link = document.createElement('a');
    link.href = `/api/bookings/${bookingId}/pdf`;
    link.download = `booking-${bookingId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
