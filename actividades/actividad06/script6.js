// Definición de patrones de conversión
const patternsData = {
    patterns: [
        // Suma
        {
            natural: "la suma de [num_a] y [num_b]",
            algebraic: "[num_a] + [num_b]",
            example: "La suma de 5 y 3"
        },
        {
            natural: "[num_a] más [num_b]",
            algebraic: "[num_a] + [num_b]",
            example: "x más 7"
        },
        {
            natural: "[num_a] aumentado en [num_b]",
            algebraic: "[num_a] + [num_b]",
            example: "El doble de un número aumentado en 5"
        },
        // Resta
        {
            natural: "la diferencia entre [num_a] y [num_b]",
            algebraic: "[num_a] - [num_b]",
            example: "La diferencia entre 10 y el triple de x"
        },
        {
            natural: "[num_a] menos [num_b]",
            algebraic: "[num_a] - [num_b]",
            example: "y menos 4"
        },
        {
            natural: "[num_a] disminuido en [num_b]",
            algebraic: "[num_a] - [num_b]",
            example: "Un número disminuido en 2"
        },
        // Multiplicación
        {
            natural: "el producto de [num_a] y [num_b]",
            algebraic: "[num_a] × [num_b]",
            example: "El producto de 4 y un número"
        },
        {
            natural: "[num_a] por [num_b]",
            algebraic: "[num_a] × [num_b]",
            example: "8 por y"
        },
        {
            natural: "el doble de [num_a]",
            algebraic: "2 × [num_a]",
            example: "El doble de un número"
        },
        {
            natural: "el triple de [num_a]",
            algebraic: "3 × [num_a]",
            example: "El triple de z"
        },
        // División
        {
            natural: "el cociente de [num_a] y [num_b]",
            algebraic: "[num_a] ÷ [num_b]",
            example: "El cociente de un número y 3"
        },
        {
            natural: "la mitad de [num_a]",
            algebraic: "[num_a] ÷ 2",
            example: "La mitad de un número"
        },
        {
            natural: "la tercera parte de [num_a]",
            algebraic: "[num_a] ÷ 3",
            example: "La tercera parte de un número"
        },
        // Potenciación
        {
            natural: "[num_a] al cuadrado",
            algebraic: "[num_a]²",
            example: "Un número al cuadrado"
        },
        {
            natural: "[num_a] al cubo",
            algebraic: "[num_a]³",
            example: "El triple de un número al cubo"
        },
        {
            natural: "[num_a] elevado a la [num_b]",
            algebraic: "[num_a]^[num_b]",
            example: "Un número elevado a la 4"
        },
        // Combinados (Ejemplo de uso de otras expresiones internas)
        {
            natural: "el doble de un número aumentado en [num_a]",
            algebraic: "2x + [num_a]",
            example: "El doble de un número aumentado en 5"
        },
        {
            natural: "un número al cuadrado más el mismo número",
            algebraic: "x² + x",
            example: "Un número al cuadrado más el mismo número"
        }
    ],
    // Patrones para reconocimiento de variables en lenguaje natural
    variableMappings: {
        "un número": "x",
        "el mismo número": "x",
        "cierto número": "x",
        "cualquier número": "x"
    }
};

function displayPatterns() {
    const list = document.getElementById('patterns-list');
    list.innerHTML = patternsData.patterns.map(p => `
        <div class="pattern-item">
            <strong>Natural:</strong> ${p.natural}<br>
            <em>Algebraico:</em> ${p.algebraic}
        </div>
    `).join('');
}

// Función auxiliar para transformar el input natural (un número a x)
function normalizeNaturalInput(input) {
    let normalized = input.toLowerCase().trim();
    for (const [key, value] of Object.entries(patternsData.variableMappings)) {
        normalized = normalized.replace(new RegExp(`\\b${key}\\b`, 'g'), value);
    }
    return normalized;
}

// Función auxiliar para encontrar coincidencias de patrones
function matchPattern(input, pattern) {
    const regex = new RegExp(pattern.replace(/\[num_a\]/g, '(.+)').replace(/\[num_b\]/g, '(.+)'));
    const match = input.match(regex);
    
    if (match) {
        const variables = {};
        if (pattern.includes('[num_a]')) variables.num_a = match[1];
        if (pattern.includes('[num_b]')) variables.num_b = match[2];
        return { isMatch: true, variables };
    }
    return { isMatch: false, variables: {} };
}

// Función auxiliar para sustituir variables en la expresión
function substituteVariables(template, variables) {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
        // Asegurar que la variable original (x, y, etc.) se respete
        let valueToUse = value.trim();
        if (valueToUse.includes('un número') || valueToUse.includes('el mismo número')) {
            valueToUse = 'x';
        }
        
        // Reemplazar la variable de patrón
        result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), valueToUse);
    }
    return result;
}

// Lógica de conversión de Natural a Algebraico
function processNaturalToAlgebraic(input) {
    const normalized = normalizeNaturalInput(input);

    // Intentar buscar coincidencias directas en los patrones
    for (let p of patternsData.patterns) {
        const m = matchPattern(normalized, p.natural);
        if (m.isMatch) {
            // Sustituir variables encontradas en el patrón algebraico
            return substituteVariables(p.algebraic, m.variables);
        }
    }

    // Si no se encuentra un patrón específico, intentar parsear elementos individuales (muy básico)
    if (normalized.includes('el doble de x')) return normalized.replace('el doble de x', '2x');
    if (normalized.includes('el triple de x')) return normalized.replace('el triple de x', '3x');
    if (normalized.includes('x al cuadrado')) return normalized.replace('x al cuadrado', 'x²');
    
    // Simplificar expresiones comunes si no hay coincidencia directa
    const simplified = normalized
        .replace(/aumentado en/g, '+')
        .replace(/menos/g, '-')
        .replace(/más/g, '+')
        .replace(/por/g, '*')
        .replace(/dividido entre/g, '/')
        .replace(/la mitad de/g, '/ 2 *') // Necesita un manejo más complejo

    // Si aún hay texto, devolver un error
    if (/[a-z]/.test(simplified) && !simplified.includes('x')) {
        return "No se pudo interpretar la expresión. Intenta usar un patrón más simple o conocido.";
    }

    return simplified;
}

// Lógica de conversión de Algebraico a Natural
function processAlgebraicToNatural(input){
    // Normalizar a una forma interna para comparación (ej: * -> ×)
    const normalized = input.replace(/\s+/g,'').replace(/\*/g,'×').replace(/\//g,'÷');

    // Buscar el patrón algebraico que coincida
    for(let p of patternsData.patterns){
        const m = matchPattern(normalized, p.algebraic);
        if(m.isMatch){
            // Sustituir las variables encontradas en el patrón natural
            return substituteVariables(p.natural, m.variables);
        }
    }
    
    // Si no hay coincidencia con patrones, dar una descripción simple
    if (normalized.includes('x² + x')) return 'un número al cuadrado más el mismo número';
    if (normalized.includes('+')) return 'una suma';
    if (normalized.includes('-')) return 'una resta';
    if (normalized.includes('×')) return 'una multiplicación';
    
    return "No se encontró un patrón coincidente.";
}

function setupEventListeners() {
    document.getElementById('convert-to-algebraic-btn').addEventListener('click', convertNaturalToAlgebraic);
    document.getElementById('convert-to-natural-btn').addEventListener('click', convertAlgebraicToNatural);
    displayPatterns(); // Mostrar patrones al cargar
}

function convertNaturalToAlgebraic() {
    const input = document.getElementById('natural-input').value.trim();
    if (!input) { alert('Por favor, ingresa una expresión en lenguaje natural'); return; }
    const result = processNaturalToAlgebraic(input);
    document.getElementById('natural-output').textContent = result;
    document.getElementById('natural-result').style.display = 'block';
}

function convertAlgebraicToNatural() {
    const input = document.getElementById('algebraic-input').value.trim();
    if (!input) { alert('Por favor, ingresa una expresión algebraica'); return; }
    const result = processAlgebraicToNatural(input);
    document.getElementById('algebraic-output').textContent = result;
    document.getElementById('algebraic-result').style.display = 'block';
}

// Iniciar los event listeners al cargar el documento
document.addEventListener('DOMContentLoaded', setupEventListeners);