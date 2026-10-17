document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const roofWidthInput = document.getElementById('roofWidth');
    const roofLengthInput = document.getElementById('roofLength');
    const sunZoneSelect = document.getElementById('sunZone');
    const annualRainfallInput = document.getElementById('annualRainfall');
    const roofMaterialSelect = document.getElementById('roofMaterial');
    const electricityRateInput = document.getElementById('electricityRate');

    const widthValSpan = document.getElementById('widthVal');
    const lengthValSpan = document.getElementById('lengthVal');
    const rainValSpan = document.getElementById('rainVal');
    const rateValSpan = document.getElementById('rateVal');

    const roofGrid = document.getElementById('roofGrid');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    const totalSolarGen = document.getElementById('totalSolarGen');
    const solarSavings = document.getElementById('solarSavings');
    const totalCarbon = document.getElementById('totalCarbon');
    const totalWaterGen = document.getElementById('totalWaterGen');
    const waterSavings = document.getElementById('waterSavings');

    const catchmentArea = document.getElementById('catchmentArea');
    const annualHarvest = document.getElementById('annualHarvest');
    const recTankSize = document.getElementById('recTankSize');
    const waterOffset = document.getElementById('waterOffset');
    const waterFill = document.getElementById('waterFill');
    const tankLitresLabel = document.getElementById('tankLitresLabel');

    const monthlyChart = document.getElementById('monthlyChart');

    const btnReset = document.getElementById('btnReset');
    const btnPrint = document.getElementById('btnPrint');
    const reportModal = document.getElementById('reportModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const reportDate = document.getElementById('reportDate');

    // Report fields
    const repDim = document.getElementById('repDim');
    const repMat = document.getElementById('repMat');
    const repSun = document.getElementById('repSun');
    const repRain = document.getElementById('repRain');
    const repPanels = document.getElementById('repPanels');
    const repEnergy = document.getElementById('repEnergy');
    const repMoney = document.getElementById('repMoney');
    const repCarbon = document.getElementById('repCarbon');
    const repWater = document.getElementById('repWater');
    const repTank = document.getElementById('repTank');

    // State
    let activeCells = new Set(); // Stores indices of active solar panels

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const target = document.getElementById(btn.dataset.tab);
            if (target) target.classList.add('active');
        });
    });

    // Initialize Grid
    function initGrid() {
        const w = parseInt(roofWidthInput.value);
        const l = parseInt(roofLengthInput.value);
        widthValSpan.textContent = w;
        lengthValSpan.textContent = l;

        roofGrid.style.gridTemplateColumns = `repeat(${w}, 1fr)`;
        roofGrid.innerHTML = '';

        const totalCells = w * l;
        
        // If active cells exceed new grid size, trim them
        const newActiveCells = new Set();

        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.index = i;

            // Default initial activation: fill roughly 60% of cells for a realistic baseline
            if (activeCells.size === 0) {
                if (i % 2 === 0 && i < totalCells * 0.7) {
                    newActiveCells.add(i);
                }
            } else if (activeCells.has(i)) {
                newActiveCells.add(i);
            }

            if (newActiveCells.has(i)) {
                cell.classList.add('active');
            }

            cell.addEventListener('click', () => {
                if (newActiveCells.has(i)) {
                    newActiveCells.delete(i);
                    cell.classList.remove('active');
                } else {
                    newActiveCells.add(i);
                    cell.classList.add('active');
                }
                activeCells = newActiveCells;
                updateCalculations();
            });

            roofGrid.appendChild(cell);
        }

        if (activeCells.size === 0) {
            activeCells = newActiveCells;
        }

        updateCalculations();
    }

    // Calculations & Updates
    function updateCalculations() {
        const w = parseInt(roofWidthInput.value);
        const l = parseInt(roofLengthInput.value);
        const area = w * l;
        const sunYieldPerKw = parseFloat(sunZoneSelect.value);
        const rainfall = parseInt(annualRainfallInput.value);
        const runoffCoeff = parseFloat(roofMaterialSelect.value);
        const elecRate = parseFloat(electricityRateInput.value);

        // Update labels
        widthValSpan.textContent = w;
        lengthValSpan.textContent = l;
        rainValSpan.textContent = rainfall;
        rateValSpan.textContent = elecRate.toFixed(2);

        // Solar calculation: Each active cell represents approx 1m² (0.4 kWp per panel)
        const panelCount = activeCells.size;
        const totalKwP = panelCount * 0.4; // 400W per panel
        const annualSolarKwh = Math.round(totalKwP * sunYieldPerKw);
        const annualSolarDollars = Math.round(annualSolarKwh * elecRate);
        const carbonTons = (annualSolarKwh * 0.0007).toFixed(1);

        // Water calculation
        const harvestedLiters = Math.round(area * rainfall * runoffCoeff);
        const waterBillSavings = Math.round((harvestedLiters / 1000) * 3.50); // ~$3.50 per cubic meter municipal water
        const recommendedTank = Math.round(harvestedLiters / 10 / 500) * 500 || 1000;
        const tankFillPercent = Math.min(100, Math.max(15, Math.round((harvestedLiters / 150000) * 100)));

        // Update UI metrics
        totalSolarGen.textContent = `${annualSolarKwh.toLocaleString()} kWh`;
        solarSavings.textContent = `Est. Savings: $${annualSolarDollars.toLocaleString()} / yr`;
        totalCarbon.textContent = `${carbonTons} Tons`;
        totalWaterGen.textContent = `${harvestedLiters.toLocaleString()} L`;
        waterSavings.textContent = `Est. Bill Reduction: $${waterBillSavings.toLocaleString()} / yr`;

        catchmentArea.textContent = `${area} m²`;
        annualHarvest.textContent = `${harvestedLiters.toLocaleString()} Liters`;
        recTankSize.textContent = `${recommendedTank.toLocaleString()} Liters`;
        waterFill.style.height = `${tankFillPercent}%`;
        tankLitresLabel.textContent = `${Math.round(harvestedLiters / 12).toLocaleString()} L avg`;

        // Water offset description
        let offsetPct = Math.min(100, Math.round((harvestedLiters / 140000) * 100));
        waterOffset.textContent = `${offsetPct}% of household non-potable needs`;

        // Update Report Data
        repDim.textContent = `${w}m x ${l}m (${area} m²)`;
        repMat.textContent = roofMaterialSelect.options[roofMaterialSelect.selectedIndex].text;
        repSun.textContent = `${sunYieldPerKw.toLocaleString()} kWh/kWp`;
        repRain.textContent = `${rainfall} mm`;
        repPanels.textContent = `${panelCount} Panels (~${totalKwP.toFixed(1)} kWp)`;
        repEnergy.textContent = `${annualSolarKwh.toLocaleString()} kWh`;
        repMoney.textContent = `$${annualSolarDollars.toLocaleString()} / year`;
        repCarbon.textContent = `${carbonTons} metric tons / year`;
        repWater.textContent = `${harvestedLiters.toLocaleString()} Liters`;
        repTank.textContent = `${recommendedTank.toLocaleString()} Liters`;

        renderMonthlyChart(annualSolarKwh, harvestedLiters);
    }

    // Render Simulated Monthly Chart
    function renderMonthlyChart(yearlySolar, yearlyWater) {
        monthlyChart.innerHTML = '';
        // Seasonal distribution weights (Jan to Dec)
        const solarWeights = [0.05, 0.06, 0.08, 0.10, 0.12, 0.13, 0.13, 0.12, 0.10, 0.07, 0.05, 0.04];
        const waterWeights = [0.12, 0.11, 0.10, 0.09, 0.07, 0.05, 0.04, 0.04, 0.06, 0.09, 0.11, 0.12];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const maxSolarMonth = yearlySolar * 0.13;

        for (let i = 0; i < 12; i++) {
            const monthSolar = yearlySolar * solarWeights[i];
            const monthWater = (yearlyWater * waterWeights[i]) / 100; // Scaled for visual comparison

            const group = document.createElement('div');
            group.className = 'bar-group';

            const bar = document.createElement('div');
            bar.className = 'bar';
            const heightPct = Math.max(10, Math.min(100, (monthSolar / maxSolarMonth) * 100));
            bar.style.height = `${heightPct}%`;
            bar.title = `${months[i]}: ${Math.round(monthSolar)} kWh solar, ${Math.round(monthWater * 100)} L rain`;

            const label = document.createElement('span');
            label.className = 'bar-label';
            label.textContent = months[i];

            group.appendChild(bar);
            group.appendChild(label);
            monthlyChart.appendChild(group);
        }
    }

    // Event Listeners for inputs
    [roofWidthInput, roofLengthInput].forEach(input => {
        input.addEventListener('input', initGrid);
    });

    [sunZoneSelect, annualRainfallInput, roofMaterialSelect, electricityRateInput].forEach(input => {
        input.addEventListener('input', updateCalculations);
    });

    // Reset Button
    btnReset.addEventListener('click', () => {
        activeCells.clear();
        roofWidthInput.value = 10;
        roofLengthInput.value = 12;
        sunZoneSelect.value = "1500";
        annualRainfallInput.value = 850;
        roofMaterialSelect.value = "0.90";
        electricityRateInput.value = "0.18";
        initGrid();
    });

    // Modal Actions
    btnPrint.addEventListener('click', () => {
        reportDate.textContent = `Generated on ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`;
        reportModal.classList.add('open');
    });

    btnCloseModal.addEventListener('click', () => {
        reportModal.classList.remove('open');
    });

    window.addEventListener('click', (e) => {
        if (e.target === reportModal) {
            reportModal.classList.remove('open');
        }
    });

    // Initial setup call
    initGrid();
});
