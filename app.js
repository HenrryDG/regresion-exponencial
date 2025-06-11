const addRowBtn = document.getElementById('add-row');
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
  bindAutoUpdate(); // ✅ importante para que calcule al escribir
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

  let numerator = 0, denominator = 0;
  for (let i = 0; i < X.length; i++) {
    numerator += (X[i] - xMean) * (lnY[i] - lnYMean);
    denominator += (X[i] - xMean) ** 2;
  }

  const b = numerator / denominator;
  const a = Math.exp(lnYMean - b * xMean);
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
    <div class="bg-white shadow-md rounded-lg p-6 mt-4">
        <h2 class="text-xl font-bold mb-2 text-gray-800">Resultados:</h2>
        <div class="mb-3">
            <span class="font-semibold text-gray-700">Ecuación:</span>
            <span class="font-mono text-blue-700">Ŷ = ${a.toFixed(4)} × e<sup>(${b.toFixed(4)}·X)</sup></span>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-4">
            <div><span class="font-semibold text-gray-700">R²:</span> <span class="text-green-700">${r2.toFixed(4)} -> ${(r2*100).toFixed(2)}%</span></div>
            <div><span class="font-semibold text-gray-700">ECM:</span> <span class="text-purple-700">${ecm.toFixed(4)}</span></div>
            <div><span class="font-semibold text-gray-700">EMA:</span> <span class="text-orange-700">${ema.toFixed(4)}</span></div>
            <div><span class="font-semibold text-gray-700">EEE:</span> <span class="text-pink-700">${eee.toFixed(4)}</span></div>
        </div>
        <h3 class="font-semibold mt-4 mb-2 text-gray-800">Proyección de datos:</h3>
        <ul class="list-disc ml-8 space-y-1 text-gray-700">
            ${X.map((x, i) => `<li><span class="font-mono">X = ${x}</span>, <span class="font-mono">Ŷ = ${Yhat[i].toFixed(4)}</span></li>`).join('')}
        </ul>
    </div>
`;

  const sorted = X.map((x, i) => ({ x, y: Yhat[i] }))
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
        },
        {
          label: 'Regresión exponencial',
          data: sorted,
          borderColor: 'red',
          backgroundColor: 'transparent',
          type: 'line',
          tension: 0.2
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
