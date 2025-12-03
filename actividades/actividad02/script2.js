/* ==================== VARIABLES GLOBALES ==================== */
let numbers = [];
let selectedPointA = { value: null, originalInput: 'Punto A' };
let selectedPointB = { value: null, originalInput: 'Punto B' };

const canvas = document.getElementById('numberLineCanvas');
const ctx = canvas.getContext('2d');
const resultDiv = document.getElementById('result');

/* ==================== FUNCIONES DE PARSEO ==================== */
function parseInput(inputStr) {
    inputStr = inputStr.trim().toLowerCase();
    
    // Sustituir constantes matemáticas
    inputStr = inputStr.replace(/pi/g, 'Math.PI');
    inputStr = inputStr.replace(/e\b/g, 'Math.E');
    // Sustituir funciones matemáticas
    inputStr = inputStr.replace(/sqrt\s*\(([^)]+)\)/g, 'Math.sqrt($1)');
    
    // Evaluar la expresión
    try {
        const result = Function('"use strict"; return (' + inputStr + ')')();
        if (isNaN(result) || !isFinite(result)) {
            return null; // Valor no válido
        }
        return { value: result, originalInput: inputStr };
    } catch (error) {
        return null; // Error de sintaxis
    }
}

function addNumber() {
    const inputElement = document.getElementById('numberInput');
    const inputStr = inputElement.value.trim();

    if (!inputStr) {
        alert("Por favor, ingresa un número o expresión.");
        return;
    }

    const parsed = parseInput(inputStr);

    if (parsed) {
        const existing = numbers.find(n => n.originalInput === parsed.originalInput);
        if (!existing) {
            numbers.push(parsed);
            numbers.sort((a, b) => a.value - b.value);
            inputElement.value = '';
            updateDisplay();
        } else {
            alert(`El valor "${inputStr}" ya ha sido agregado.`);
        }
    } else {
        alert(`Error al interpretar la expresión "${inputStr}".`);
    }
}

function removeNumber(index) {
    const removedValue = numbers[index];
    numbers.splice(index, 1);
    
    // Reiniciar selectores si el punto removido estaba seleccionado
    if (selectedPointA.originalInput === removedValue.originalInput) {
        selectedPointA = { value: null, originalInput: 'Punto A' };
        document.getElementById('pointA-selected').textContent = 'Punto A';
    }
    if (selectedPointB.originalInput === removedValue.originalInput) {
        selectedPointB = { value: null, originalInput: 'Punto B' };
        document.getElementById('pointB-selected').textContent = 'Punto B';
    }

    updateDisplay();
    // Limpiar resultado de distancia si los puntos seleccionados ya no existen
    if (!selectedPointA.value && !selectedPointB.value) {
        resultDiv.innerHTML = 'Selecciona dos puntos de la lista para calcular la distancia.';
    }
}

function clearNumbers() {
    numbers = [];
    selectedPointA = { value: null, originalInput: 'Punto A' };
    selectedPointB = { value: null, originalInput: 'Punto B' };
    document.getElementById('pointA-selected').textContent = 'Punto A';
    document.getElementById('pointB-selected').textContent = 'Punto B';
    resultDiv.innerHTML = 'Selecciona dos puntos de la lista para calcular la distancia.';
    updateDisplay();
}

/* ==================== MANEJO DE DISPLAY ==================== */
function updateDisplay() {
    updateNumberList();
    updateSelectors();
    drawNumberLine();
}

function updateNumberList() {
    const listDiv = document.getElementById('numbers-list');
    listDiv.innerHTML = numbers.map((n, index) => `
        <div class="number-tag">
            ${n.originalInput} (${n.value.toFixed(3)})
            <button class="remove-btn" onclick="removeNumber(${index})">x</button>
        </div>
    `).join('');
}

function updateSelectors() {
    ['A', 'B'].forEach(letter => {
        const itemsDiv = document.getElementById(`pointA-items`);
        const currentSelection = letter === 'A' ? selectedPointA : selectedPointB;
        
        itemsDiv.innerHTML = `<div class="select-item placeholder-item" onclick="selectPoint('A', null)">Selecciona Punto A</div>`;
        
        numbers.forEach((n, index) => {
            const isSelected = n.originalInput === currentSelection.originalInput;
            const itemClass = isSelected ? 'select-item same-as-selected' : 'select-item';
            
            // Usar una función parcial para manejar la selección
            const onClickHandler = `selectPoint('${letter}', ${index})`;

            itemsDiv.innerHTML += `<div class="${itemClass}" onclick="${onClickHandler}">
                ${n.originalInput} (${n.value.toFixed(3)})
            </div>`;
        });
    });
}

function selectPoint(pointLetter, numberIndex) {
    const isA = pointLetter === 'A';
    const selectedDiv = document.getElementById(isA ? 'pointA-selected' : 'pointB-selected');
    const itemsDiv = document.getElementById(isA ? 'pointA-items' : 'pointB-items');
    
    itemsDiv.classList.remove('show');

    if (numberIndex !== null) {
        const selectedNumber = numbers[numberIndex];
        const point = { value: selectedNumber.value, originalInput: selectedNumber.originalInput };
        
        if (isA) {
            selectedPointA = point;
        } else {
            selectedPointB = point;
        }
        
        selectedDiv.textContent = point.originalInput;
    } else {
        // Deseleccionar
        if (isA) {
            selectedPointA = { value: null, originalInput: 'Punto A' };
        } else {
            selectedPointB = { value: null, originalInput: 'Punto B' };
        }
        selectedDiv.textContent = isA ? 'Punto A' : 'Punto B';
    }
}

/* ==================== DIBUJO EN CANVAS ==================== */
function drawNumberLine() {
    const padding = 50;
    const height = 150;
    canvas.height = height;

    if (numbers.length === 0) {
        canvas.width = 400;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.fillText('Añade números para ver la recta', canvas.width / 2, height / 2);
        return;
    }

    // Calcular rango y escalar
    const minVal = numbers[0].value;
    const maxVal = numbers[numbers.length - 1].value;
    const range = maxVal - minVal;

    // Extender el rango para que los puntos no toquen los bordes
    const extendedMin = minVal - range * 0.1 - 1;
    const extendedMax = maxVal + range * 0.1 + 1;
    const extendedRange = extendedMax - extendedMin;

    const canvasWidth = Math.max(800, extendedRange * 50 + 2 * padding); // Ancho mínimo de 800px
    canvas.width = canvasWidth;

    const lineY = height / 2;

    // Función de mapeo: valor real -> posición en canvas
    function mapToCanvas(value) {
        return padding + ((value - extendedMin) / extendedRange) * (canvasWidth - 2 * padding);
    }

    // 1. Dibujar la línea principal
    ctx.clearRect(0, 0, canvasWidth, height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, lineY);
    ctx.lineTo(canvasWidth - padding, lineY);
    ctx.stroke();

    // 2. Dibujar marcas y etiquetas de números enteros y cero
    const zeroPos = mapToCanvas(0);
    const scale = 1; // Marcas cada unidad
    
    // Determinar inicio y fin para las marcas
    const startTick = Math.floor(extendedMin);
    const endTick = Math.ceil(extendedMax);

    ctx.textAlign = 'center';
    ctx.font = '12px Segoe Print';

    for (let i = startTick; i <= endTick; i += scale) {
        const x = mapToCanvas(i);
        
        // Marcas
        ctx.beginPath();
        ctx.moveTo(x, lineY - 5);
        ctx.lineTo(x, lineY + 5);
        ctx.stroke();

        // Etiquetas
        ctx.fillStyle = (i === 0) ? 'red' : 'black';
        ctx.fillText(i.toString(), x, lineY + 20);
    }

    // 3. Dibujar los puntos ingresados
    numbers.forEach(point => {
        const x = mapToCanvas(point.value);
        let color = 'blue';
        
        if (point.originalInput === selectedPointA.originalInput) {
            color = 'green';
        } else if (point.originalInput === selectedPointB.originalInput) {
            color = 'purple';
        }

        // Círculo del punto
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, lineY, 5, 0, 2 * Math.PI);
        ctx.fill();

        // Etiqueta del punto
        ctx.fillStyle = color;
        ctx.font = '14px Segoe Print';
        ctx.fillText(`${point.originalInput}`, x, lineY - 15);
    });
}

/* ==================== LÓGICA DE DISTANCIA ==================== */
function calculateDistance() {
    if (!selectedPointA.value || !selectedPointB.value) {
        resultDiv.innerHTML = '<div class="distance-result"><strong>Error:</strong> Debes seleccionar los dos puntos (A y B) para calcular la distancia.</div>';
        return;
    }

    const pointA = selectedPointA;
    const pointB = selectedPointB;

    const distance = Math.abs(pointA.value - pointB.value);
    
    resultDiv.innerHTML = `<div class="distance-result">
        <strong>Distancia entre ${pointA.originalInput} y ${pointB.originalInput}:</strong><br>
        <strong>d(a,b) = |${pointA.value.toFixed(3)} - ${pointB.value.toFixed(3)}| = ${distance.toFixed(6)} unidades</strong>
    </div>`;

    console.log(`Distancia calculada: |${pointA.value}-${pointB.value}|=${distance}`);
}

/* ==================== EVENT LISTENERS Y INICIALIZACIÓN ==================== */
document.getElementById('numberInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addNumber();
});

// Lógica de apertura/cierre de los selectores custom
document.getElementById('pointA-selected').onclick = function(e) {
    e.stopPropagation(); 
    const items = document.getElementById('pointA-items'); 
    const isOpen = items.classList.contains('show'); 
    document.querySelectorAll('.select-items').forEach(item => item.classList.remove('show')); 
    if (!isOpen) items.classList.add('show');
};
document.getElementById('pointB-selected').onclick = function(e) {
    e.stopPropagation(); 
    const items = document.getElementById('pointB-items'); 
    const isOpen = items.classList.contains('show'); 
    document.querySelectorAll('.select-items').forEach(item => item.classList.remove('show')); 
    if (!isOpen) items.classList.add('show');
};

// Cerrar selectores al hacer click fuera
document.addEventListener('click', function(e) {
    if (!e.target.closest('.custom-select')) 
        document.querySelectorAll('.select-items').forEach(item => item.classList.remove('show'));
});

console.log('Aplicación inicializada correctamente');
updateDisplay();