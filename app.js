const addRowBtn = document.getElementById('add-row');
const deleteRowBtn = document.getElementById('remove-row');
const container = document.getElementById('input-container');
const calculateBtn = document.getElementById('calculate');
const resultsDiv = document.getElementById('results');
let chart;

addRowBtn.addEventListener('click', () => {
  const xInput = document.createElement('input');
  const yInput = document.createElement('input');
  xInput.type = yInput.type = 'number';
  xInput.step = yInput.step = 'any';
  xInput.placeholder = 'X';
  yInput.placeholder = 'Y';
  xInput.className = 'x-input border rounded p-2';
  yInput.className = 'y-input border rounded p-2';
  container.appendChild(xInput);
  container.appendChild(yInput);
  bindAutoUpdate();
});

deleteRowBtn.addEventListener('click', () => {
  const inputs = document.querySelectorAll('.x-input, .y-input');
  if (inputs.length > 2) { // Mantiene al menos dos filas
    inputs[inputs.length - 1].remove();
    inputs[inputs.length - 2].remove();
    autoCalculate(); // Vuelve a recalcular después de eliminar una fila
  }
});

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

calculateBtn.addEventListener('click', () => {
  const xInputs = document.querySelectorAll('.x-input');
  const yInputs = document.querySelectorAll('.y-input');

  const X = [];
  const Y = [];
  for (let i = 0; i < xInputs.length; i++) {
    const xVal = parseFloat(xInputs[i].value);
    const yVal = parseFloat(yInputs[i].value);
    if (
      xInputs[i].value.trim() === '' ||
      yInputs[i].value.trim() === ''
    ) {
      continue;
    }
    if (!isNaN(xVal) && !isNaN(yVal) && yVal > 0) {
      X.push(xVal);
      Y.push(yVal);
    }
  }

  if (X.length < 2) {
    return;
  }

  const lnY = Y.map(y => Math.log(y));
  const xMean = mean(X);
  const lnYMean = mean(lnY);

  const n = X.length;
  let sumX = 0, sumLnY = 0, sumX2 = 0, sumXlnY = 0;

  for (let i = 0; i < n; i++) {
    sumX += X[i];
    sumLnY += lnY[i];
    sumX2 += X[i] * X[i];
    sumXlnY += X[i] * lnY[i];
  }

  var mediaX = mean(X);
  var mediaLnY = mean(lnY);

  const b = (n * sumXlnY - sumX * sumLnY) / (n * sumX2 - sumX * sumX);
  const a = Math.exp((mediaLnY - b * mediaX));
  const Yhat = X.map(x => a * Math.exp(b * x));

  let sse = 0, sea = 0, sst = 0;
  const yMean = mean(Y);

  for (let i = 0; i < Y.length; i++) {
    const err = Y[i] - Yhat[i];
    sse += err ** 2;
    sea += Math.abs(err);
    sst += (Y[i] - yMean) ** 2;
  }

  const r2 = 1 - (sse / sst);
  const ecm = sse / Y.length;
  const ema = sea / Y.length;
  const eee = Math.sqrt(ecm);

  resultsDiv.innerHTML = `
    <div class="bg-gradient-to-br from-white via-blue-50 to-blue-100 shadow-lg rounded-xl p-8 mt-6 border border-blue-200">
        <h2 class="text-2xl font-extrabold mb-4 text-blue-900 tracking-tight">Resultados</h2>
        <div class="mb-5 flex flex-col sm:flex-row sm:items-center sm:gap-6">
            <div class="mb-2 sm:mb-0">
                <span class="font-semibold text-gray-700">Ecuación:</span>
                <span class="font-mono text-blue-800 text-lg bg-blue-100 px-2 py-1 rounded shadow-sm">Ŷ = ${a.toFixed(4)} × e<sup>(${b.toFixed(4)}·X)</sup></span>
            </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-center">
            <div class="bg-green-50 rounded-lg p-3 shadow">
                <div class="text-xs text-gray-500 font-medium">Coeficiente de Determinación (R<sup>2</sup>)</div>
                <div class="text-green-700 font-bold text-lg">${r2.toFixed(4)}</div>
                <div class="text-green-600 text-xs">${(r2 * 100).toFixed(2)}%</div>
            </div>
            <div class="bg-purple-50 rounded-lg p-3 shadow">
                <div class="text-xs text-gray-500 font-medium">Error Cuadrático Medio (ECM)</div>
                <div class="text-purple-700 font-bold text-lg">${ecm.toFixed(4)}</div>
            </div>
            <div class="bg-orange-50 rounded-lg p-3 shadow">
                <div class="text-xs text-gray-500 font-medium">Error Medio Absoluto (EMA)</div>
                <div class="text-orange-700 font-bold text-lg">${ema.toFixed(4)}</div>
            </div>
            <div class="bg-pink-50 rounded-lg p-3 shadow">
                <div class="text-xs text-gray-500 font-medium">Error Estándar de la Estimación (EEE)</div>
                <div class="text-pink-700 font-bold text-lg">${eee.toFixed(4)}</div>
            </div>
        </div>
        <h3 class="font-semibold mt-6 mb-3 text-blue-900 text-lg">Proyección de datos</h3>
        <ul class="list-disc ml-8 space-y-1 text-gray-800 text-base">
            ${X.map((x, i) => `<li><span class="font-mono text-blue-900">X = ${x}</span>, <span class="font-mono text-green-800">Ŷ = ${Yhat[i].toFixed(4)}</span></li>`).join('')}
        </ul>
    </div>
  `;

  const sorted = X.map((x, i) => ({ x, y: Yhat[i] }))
    .sort((a, b) => a.x - b.x);

  // Dibuja la línea original (conecta los puntos originales)
  const originalLine = X.map((x, i) => ({ x, y: Y[i] }))
    .sort((a, b) => a.x - b.x);

  const ctx = document.getElementById('chart').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Datos originales',
          data: X.map((x, i) => ({ x, y: Y[i] })),
          backgroundColor: 'blue',
          showLine: false
        },
        {
          label: 'Línea original',
          data: originalLine,
          borderColor: 'gray',
          backgroundColor: 'transparent',
          type: 'line',
          fill: false,
          pointRadius: 0,
          borderWidth: 2,
          borderDash: [5, 5],
          order: 1
        },
        {
          label: 'Regresión exponencial',
          data: sorted,
          borderColor: 'red',
          backgroundColor: 'transparent',
          type: 'line',
          tension: 0.2,
          fill: false,
          pointRadius: 0,
          borderWidth: 2,
          order: 2
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'X' } },
        y: { title: { display: true, text: 'Y' } }
      }
    }
  });
});

// Función para recalcular automáticamente
function autoCalculate() {
  try {
    calculateBtn.click(); // Reutilizamos el botón "Calcular"
  } catch (e) {
    console.warn("Cálculo automático fallido:", e);
  }
}

// Observador de eventos para entradas existentes y futuras
function bindAutoUpdate() {
  const inputs = document.querySelectorAll('.x-input, .y-input');
  inputs.forEach(input => {
    input.removeEventListener('input', autoCalculate); // Evita duplicados
    input.addEventListener('input', autoCalculate);
  });
}


// Inicializa el binding al cargar la página
bindAutoUpdate();
