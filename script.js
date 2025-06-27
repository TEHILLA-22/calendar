document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const calendarGrid = document.getElementById('calendar-grid');
    const calendarHeader = document.querySelector('.calendar-grid-header');
    const monthSelect = document.getElementById('month-select');
    const yearSelect = document.getElementById('year-select');
    const prevYearBtn = document.getElementById('prev-year');
    const nextYearBtn = document.getElementById('next-year');
    const todayBtn = document.getElementById('today-btn');
    const viewMonthBtn = document.getElementById('view-month');
    const viewYearBtn = document.getElementById('view-year');
    const currentDateDisplay = document.getElementById('current-date-display');
    const eventModal = document.getElementById('event-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelEventBtn = document.getElementById('cancel-event');
    const saveEventBtn = document.getElementById('save-event');
    const eventTitleInput = document.getElementById('event-title');
    const eventDateInput = document.getElementById('event-date');
    
    // State
    let currentDate = new Date();
    let selectedDate = new Date();
    let events = JSON.parse(localStorage.getItem('calendarEvents')) || {};
    
    // Initialize calendar
    initCalendar();
    
    // Event Listeners
    monthSelect.addEventListener('change', () => {
        currentDate.setMonth(monthSelect.selectedIndex);
        renderCalendar();
    });
    
    yearSelect.addEventListener('change', () => {
        currentDate.setFullYear(yearSelect.value);
        renderCalendar();
    });
    
    prevYearBtn.addEventListener('click', () => {
        currentDate.setFullYear(currentDate.getFullYear() - 1);
        updateMonthYearSelectors();
        renderCalendar();
    });
    
    nextYearBtn.addEventListener('click', () => {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        updateMonthYearSelectors();
        renderCalendar();
    });
    
    todayBtn.addEventListener('click', goToToday);
    
    viewMonthBtn.addEventListener('click', () => {
        viewMonthBtn.classList.add('active');
        viewYearBtn.classList.remove('active');
        document.querySelector('.calendar-grid').style.display = 'grid';
        document.querySelector('.year-view')?.classList.remove('active');
    });
    
    viewYearBtn.addEventListener('click', () => {
        viewYearBtn.classList.add('active');
        viewMonthBtn.classList.remove('active');
        document.querySelector('.calendar-grid').style.display = 'none';
        renderYearView();
    });
    
    closeModalBtn.addEventListener('click', closeEventModal);
    cancelEventBtn.addEventListener('click', closeEventModal);
    saveEventBtn.addEventListener('click', saveEvent);
    
    // Initialize drag to navigate
    initDragNavigation();
    
    // Functions
    function initCalendar() {
        // Populate month selector
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
        
        monthSelect.innerHTML = months.map(month => 
            `<option value="${month}">${month}</option>`
        ).join('');
        
        // Populate year selector (2024-2040)
        yearSelect.innerHTML = '';
        for (let year = 2024; year <= 2040; year++) {
            yearSelect.innerHTML += `<option value="${year}">${year}</option>`;
        }
        
        // Populate weekday headers
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        calendarHeader.innerHTML = weekdays.map(day => 
            `<div>${day}</div>`
        ).join('');
        
        // Set initial values
        updateMonthYearSelectors();
        renderCalendar();
        updateCurrentDateDisplay();
    }
    
    function updateMonthYearSelectors() {
        monthSelect.selectedIndex = currentDate.getMonth();
        yearSelect.value = currentDate.getFullYear();
    }
    
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Get first day of month and total days in month
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Get days from previous month to show
        const prevMonthDays = new Date(year, month, 0).getDate();
        
        // Get days from next month to show
        const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
        const nextMonthDays = totalCells - (firstDay + daysInMonth);
        
        let calendarHTML = '';
        
        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            const date = new Date(year, month - 1, day);
            calendarHTML += createDayElement(date, true);
        }
        
        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            calendarHTML += createDayElement(date, false);
        }
        
        // Next month days
        for (let day = 1; day <= nextMonthDays; day++) {
            const date = new Date(year, month + 1, day);
            calendarHTML += createDayElement(date, true);
        }
        
        calendarGrid.innerHTML = calendarHTML;
        
        // Add event listeners to each day
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', () => openEventModal(day.dataset.date));
        });
        
        // Update current date display
        updateCurrentDateDisplay();
    }
    
    function createDayElement(date, isOtherMonth) {
        const day = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const today = new Date();
        const isToday = day === today.getDate() && 
                        month === today.getMonth() && 
                        year === today.getFullYear();
        
        // Check if this date has events
        const dayEvents = events[dateString] || [];
        
        return `
            <div class="calendar-day ${isOtherMonth ? 'other-month' : 'current-month'} ${isToday ? 'today' : ''}" 
                 data-date="${dateString}">
                <div class="day-number">${day}</div>
                ${dayEvents.map(event => `
                    <div class="event bg-${event.color}" data-event-id="${event.id}">
                        ${event.title}
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    function renderYearView() {
        const year = currentDate.getFullYear();
        const yearView = document.querySelector('.year-view') || createYearViewElement();
        
        let yearViewHTML = '';
        
        for (let month = 0; month < 12; month++) {
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            let monthHTML = `
                <div class="year-month">
                    <h3>${new Date(year, month).toLocaleString('default', { month: 'long' })}</h3>
                    <div class="year-month-grid">
            `;
            
            // Weekday headers (abbreviated)
            ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => {
                monthHTML += `<div class="text-gray-500 font-medium">${day}</div>`;
            });
            
            // Empty cells for days before the first day of the month
            for (let i = 0; i < firstDay; i++) {
                monthHTML += '<div></div>';
            }
            
            // Days of the month
            const today = new Date();
            for (let day = 1; day <= daysInMonth; day++) {
                const isCurrentDay = day === today.getDate() && 
                                    month === today.getMonth() && 
                                    year === today.getFullYear();
                
                monthHTML += `
                    <div class="${isCurrentDay ? 'current-day' : ''}">
                        ${day}
                    </div>
                `;
            }
            
            monthHTML += `
                    </div>
                </div>
            `;
            
            yearViewHTML += monthHTML;
        }
        
        yearView.innerHTML = yearViewHTML;
        yearView.classList.add('active');
        
        // Add click event to month titles to switch back to month view
        document.querySelectorAll('.year-month h3').forEach(title => {
            title.addEventListener('click', () => {
                const monthName = title.textContent;
                const monthIndex = new Date(`${monthName} 1, 2020`).getMonth();
                currentDate.setMonth(monthIndex);
                updateMonthYearSelectors();
                viewMonthBtn.click();
                renderCalendar();
            });
        });
    }
    
    function createYearViewElement() {
        const yearView = document.createElement('div');
        yearView.className = 'year-view';
        calendarGrid.insertAdjacentElement('afterend', yearView);
        return yearView;
    }
    
    function goToToday() {
        currentDate = new Date();
        selectedDate = new Date();
        updateMonthYearSelectors();
        renderCalendar();
        viewMonthBtn.click();
    }
    
    function updateCurrentDateDisplay() {
        const options = { year: 'numeric', month: 'long' };
        currentDateDisplay.textContent = currentDate.toLocaleDateString('en-US', options);
    }
    
    function openEventModal(dateString) {
        selectedDate = new Date(dateString);
        eventDateInput.value = selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        eventTitleInput.value = '';
        
        // Set active color
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('border-blue-500', 'border-2');
            option.addEventListener('click', function() {
                document.querySelectorAll('.color-option').forEach(opt => 
                    opt.classList.remove('border-blue-500', 'border-2')
                );
                this.classList.add('border-blue-500', 'border-2');
            });
        });
        
        eventModal.classList.remove('hidden');
    }
    
    function closeEventModal() {
        eventModal.classList.add('hidden');
    }
    
    function saveEvent() {
        const title = eventTitleInput.value.trim();
        if (!title) return;
        
        const dateString = selectedDate.toISOString().split('T')[0];
        const color = document.querySelector('.color-option.border-blue-500')?.dataset.color || 'blue-500';
        
        const event = {
            id: Date.now(),
            title,
            date: dateString,
            color
        };
        
        if (!events[dateString]) {
            events[dateString] = [];
        }
        
        events[dateString].push(event);
        localStorage.setItem('calendarEvents', JSON.stringify(events));
        
        closeEventModal();
        renderCalendar();
    }
    
    function initDragNavigation() {
        let startX, startY;
        let isDragging = false;
        
        calendarGrid.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startY = e.clientY;
            isDragging = false;
        });
        
        calendarGrid.addEventListener('mousemove', (e) => {
            if (Math.abs(e.clientX - startX) > 10 || Math.abs(e.clientY - startY) > 10) {
                isDragging = true;
            }
        });
        
        calendarGrid.addEventListener('mouseup', (e) => {
            if (isDragging) {
                const diffX = e.clientX - startX;
                
                if (diffX > 50) {
                    // Swipe right - previous month
                    currentDate.setMonth(currentDate.getMonth() - 1);
                } else if (diffX < -50) {
                    // Swipe left - next month
                    currentDate.setMonth(currentDate.getMonth() + 1);
                }
                
                updateMonthYearSelectors();
                renderCalendar();
            }
        });
        
        // Touch events for mobile
        calendarGrid.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = false;
        });
        
        calendarGrid.addEventListener('touchmove', (e) => {
            if (Math.abs(e.touches[0].clientX - startX) > 10 || 
                Math.abs(e.touches[0].clientY - startY) > 10) {
                isDragging = true;
            }
        });
        
        calendarGrid.addEventListener('touchend', (e) => {
            if (isDragging) {
                const diffX = e.changedTouches[0].clientX - startX;
                
                if (diffX > 50) {
                    // Swipe right - previous month
                    currentDate.setMonth(currentDate.getMonth() - 1);
                } else if (diffX < -50) {
                    // Swipe left - next month
                    currentDate.setMonth(currentDate.getMonth() + 1);
                }
                
                updateMonthYearSelectors();
                renderCalendar();
            }
        });
    }
});