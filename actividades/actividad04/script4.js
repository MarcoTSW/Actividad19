/* ==================== VARIABLES GLOBALES ==================== */
let isUpdating = false;

/* ==================== FUNCIONES DE PARSEO ==================== */
function parseNumber(input) {
    if (!input && input !== 0) return 0;
    const inputStr = input.toString().trim();
    if (!inputStr) return 0;

    let expression = inputStr
        .replace(/sqrt\s*\(/gi, 'Math.sqrt(')
        .replace(/pi\b/gi, 'Math.PI');

    try {
        const result = Function('"use strict"; return (' + expression + ')')();
        if (isNaN(result) || !isFinite(result)) {
            return 0;
        }
        return result;
    } catch (error) {
        return 0;
    }
}

function parseAngle(input) {
    return parseNumber(input);
}

/* ==================== FUNCIONES DE FORMATO ==================== */
function angleToPI(angle) {
    if (Math.abs(angle) < 1e-8) return "0";
    const piMultiples = [
        { value: Math.PI, text: "pi" },
        { value: Math.PI/2, text: "pi/2" },
        { value: Math.PI/3, text: "pi/3" },
        { value: Math.PI/4, text: "pi/4" },
        { value: Math.PI/6, text: "pi/6" },
        { value: 2*Math.PI, text: "2*pi" },
        { value: -Math.PI, text: "-pi" },
        { value: -Math.PI/2, text: "-pi/2" }
    ];
    for (let pm of piMultiples) {
        if (Math.abs(angle - pm.value) < 1e-8) {
            return pm.text;
        }
    }
    return angle.toFixed(6);
}

function formatNumber(num) {
    if (Math.abs(num) < 1e-10) return "0";
    if (Math.abs(num - Math.round(num)) < 1e-8) {
        return Math.round(num).toString();
    }
    return parseFloat(num.toFixed(6)).toString();
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle <= -Math.PI) angle += 2 * Math.PI;
    return angle;
}

/* ==================== FUNCIONES DE CONVERSIÓN ==================== */
function updateFromCartesian() {
    if (isUpdating) return;
    isUpdating = true;

    const real = parseNumber(document.getElementById('real').value) || 0;
    const imag = parseNumber(document.getElementById('imag').value) || 0;

    const modulus = Math.sqrt(real * real + imag * imag);
    let angle = Math.atan2(imag, real);
    angle = normalizeAngle(angle);

    const modulusFormatted = formatNumber(modulus);
    const angleFormatted = angleToPI(angle);

    document.getElementById('modulus').value = modulusFormatted;
    document.getElementById('angle').value = angleFormatted;
    document.getElementById('angle2').value = angleFormatted;
    document.getElementById('exp-modulus').value = modulusFormatted;
    document.getElementById('exp-angle').value = angleFormatted;

    updateResults(real, imag, modulus, angle);
    isUpdating = false;
}

function updateFromPolar() {
    if (isUpdating) return;
    isUpdating = true;

    const modulus = parseNumber(document.getElementById('modulus').value) || 0;
    const angle = parseAngle(document.getElementById('angle').value) || 0;
    const normalizedAngle = normalizeAngle(angle);

    const angleFormatted = angleToPI(normalizedAngle);
    document.getElementById('angle2').value = angleFormatted;

    const real = modulus * Math.cos(normalizedAngle);
    const imag = modulus * Math.sin(normalizedAngle);

    document.getElementById('real').value = formatNumber(real);
    document.getElementById('imag').value = formatNumber(imag);
    document.getElementById('exp-modulus').value = formatNumber(modulus);
    document.getElementById('exp-angle').value = angleFormatted;

    updateResults(real, imag, modulus, normalizedAngle);
    isUpdating = false;
}

function updateFromExponential() {
    if (isUpdating) return;
    isUpdating = true;

    const modulus = parseNumber(document.getElementById('exp-modulus').value) || 0;
    const angle = parseAngle(document.getElementById('exp-angle').value) || 0;
    const normalizedAngle = normalizeAngle(angle);

    const real = modulus * Math.cos(normalizedAngle);
    const imag = modulus * Math.sin(normalizedAngle);

    document.getElementById('real').value = formatNumber(real);
    document.getElementById('imag').value = formatNumber(imag);
    const angleFormatted = angleToPI(normalizedAngle);
    document.getElementById('modulus').value = formatNumber(modulus);
    document.getElementById('angle').value = angleFormatted;
    document.getElementById('angle2').value = angleFormatted;

    updateResults(real, imag, modulus, normalizedAngle);
    isUpdating = false;
}

function updateResults(real, imag, modulus, angle) {
    const angleText = angleToPI(angle);
    let cartesianText = "";
    if (real !== 0 || imag !== 0) {
        if (real !== 0) {
            cartesianText += formatNumber(real);
        }
        if (imag > 0) {
            cartesianText += (real !== 0 ? " + " : "") + (imag === 1 ? "i" : formatNumber(imag) + "i");
        } else if (imag < 0) {
            cartesianText += (real !== 0 ? " - " : "-") + (imag === -1 ? "i" : formatNumber(-imag) + "i");
        }
        if (cartesianText === "") cartesianText = "0";
    } else {
        cartesianText = "0";
    }
    document.getElementById('cartesian-result').textContent = "z = " + cartesianText;
    document.getElementById('polar-result').textContent = "z = " + (modulus !== 0 ? formatNumber(modulus) + "(cos(" + angleText + ") + i sin(" + angleText + "))" : "0");
    document.getElementById('exponential-result').textContent = "z = " + (modulus !== 0 ? formatNumber(modulus) + "e^(i*" + angleText + ")" : "0");
}

function clearAll() {
    const inputs = document.querySelectorAll('input[type="text"]');
    inputs.forEach(input => { if (!input.readOnly) input.value = ''; });
    const results = document.querySelectorAll('.result');
    results.forEach(result => result.textContent = 'Ingresa los valores arriba');
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('real').addEventListener('input', updateFromCartesian);
    document.getElementById('imag').addEventListener('input', updateFromCartesian);
    document.getElementById('modulus').addEventListener('input', updateFromPolar);
    document.getElementById('angle').addEventListener('input', function() {
        document.getElementById('angle2').value = this.value;
        updateFromPolar();
    });
    document.getElementById('exp-modulus').addEventListener('input', updateFromExponential);
    document.getElementById('exp-angle').addEventListener('input', updateFromExponential);
});