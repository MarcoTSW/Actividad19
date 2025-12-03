// Utilidad para limpiar strings
function cleanString(str) {
    return str.replace(/\s+/g, '');
}

// --- PARTE 1: Solución de Ecuaciones de una Variable (x) ---

function resolverEcuacionParseada() {
    const ecuacionStr = document.getElementById('ecuacion').value;
    const resBox = document.getElementById('resDespejeParseado');
    const errorBox = document.getElementById('mensajeError');

    resBox.innerHTML = '';
    errorBox.innerText = '';

    try {
        const partes = ecuacionStr.split('=');
        if (partes.length !== 2) {
            throw new Error("La ecuación debe contener exactamente un signo '='");
        }

        const ladoIzq = partes[0].trim();
        const ladoDer = partes[1].trim();

        const ecuacionFormateada = `(${ladoIzq}) - (${ladoDer})`;

        const nodo = math.parse(ecuacionFormateada);
        const simplificado = math.simplify(nodo);

        const coeficientes = extraerCoeficientes(simplificado.toString());
        const solucion = -coeficientes.b / coeficientes.a;

        resBox.innerHTML = `
            <div class="formula-original">
                <strong>Ecuación Original:</strong> ${ecuacionStr}
            </div>
            <p><strong>Solución:</strong> x = ${solucion}</p>
            <p><strong>Ecuación Simplificada:</strong> ${simplificado.toString()} = 0</p>
        `;
    } catch (error) {
        errorBox.innerText = `Error: ${error.message}`;
    }
}

function extraerCoeficientes(ecuacion) {
    ecuacion = ecuacion.replace(/\s+/g, '');

    let a = 0;
    let b = 0;

    const regexX = /([+-]?\d*\.?\d*)\*?x/g;
    let match;
    while ((match = regexX.exec(ecuacion)) !== null) {
        let coef = match[1];
        if (coef === '' || coef === '+') coef = '1';
        if (coef === '-') coef = '-1';
        a += parseFloat(coef);
    }

    const sinX = ecuacion.replace(/[+-]?\d*\.?\d*\*?x/g, '');
    if (sinX) {
        try {
            b = math.evaluate(sinX);
        } catch (e) {
            b = 0;
        }
    }

    return { a, b };
}


// --- PARTE 2: Despeje Simbólico de Fórmulas ---

function extractVariables(formulaStr) {
    const matches = formulaStr.match(/[a-zA-Z][a-zA-Z0-9]*/g);
    if (!matches) return [];
    return Array.from(new Set(matches));
}

function despejarVariable(expresionOriginal, variableObjetivo, variableDespejada) {
    try {
        let expresion = expresionOriginal.replace(/\s+/g, '');

        const patronComplejo =
            /(\d*\.?\d*)\(([a-zA-Z]+)\s*([+-])\s*(\d+\.?\d*)\)\s*\/\s*(\d+\.?\d*)/;

        const matchComplejo = expresion.match(patronComplejo);

        if (matchComplejo && matchComplejo[2] === variableObjetivo) {
            const coef1 = matchComplejo[1] || '1';
            const operador = matchComplejo[3];
            const constante = matchComplejo[4];
            const divisor = matchComplejo[5];

            const operadorInverso = operador === '-' ? '+' : '-';

            if (coef1 === '1') {
                return `(${variableDespejada}) * (${divisor}) ${operadorInverso} ${constante}`;
            } else {
                return `(${variableDespejada}) * (${divisor}) / (${coef1}) ${operadorInverso} ${constante}`;
            }
        }

        if (expresion.includes('+') || expresion.includes('-')) {
            const resultado = despejarSumaResta(expresion, variableObjetivo, variableDespejada);
            if (resultado !== null) return resultado;
        }

        if (expresion.includes('/')) {
            const partes = dividirPorOperadorPrincipal(expresion, '/');
            const numerador = partes[0];
            const denominador = partes[1];

            if (numerador.includes(variableObjetivo)) {
                const factoresNum = extraerFactoresMultiplicacion(numerador);
                const otrosFactores = factoresNum.filter(f => f !== variableObjetivo);

                if (otrosFactores.length === 0) {
                    return `(${variableDespejada}) * (${denominador})`;
                } else {
                    return `(${variableDespejada}) * (${denominador}) / (${otrosFactores.join(' * ')})`;
                }
            } else if (denominador.includes(variableObjetivo)) {
                const factoresDen = extraerFactoresMultiplicacion(denominador);
                const otrosFactores = factoresDen.filter(f => f !== variableObjetivo);

                if (otrosFactores.length === 0) {
                    return `(${numerador}) / (${variableDespejada})`;
                } else {
                    return `(${numerador}) / ((${variableDespejada}) * (${otrosFactores.join(' * ')}))`;
                }
            }
        }

        if (expresion.includes('*')) {
            const factores = extraerFactoresMultiplicacion(expresion);
            const otros = factores.filter(f => f !== variableObjetivo);

            if (otros.length === 0) {
                return variableDespejada;
            } else if (otros.length === 1) {
                return `(${variableDespejada}) / (${otros[0]})`;
            } else {
                return `(${variableDespejada}) / (${otros.join(' * ')})`;
            }
        }

        if (expresion === variableObjetivo) return variableDespejada;

        return expresion;

    } catch (error) {
        return `Error: ${error.message}`;
    }
}

function despejarSumaResta(expresion, variableObjetivo, variableDespejada) {
    const terminos = parsearTerminos(expresion);
    let terminoConVariable = null;
    let otros = [];

    for (const t of terminos) {
        if (t.texto.includes(variableObjetivo)) terminoConVariable = t;
        else otros.push(t);
    }

    if (!terminoConVariable) return null;

    let resultado = variableDespejada;

    for (const t of otros) {
        const signoInv = t.signo === '+' ? '-' : '+';
        resultado += ` ${signoInv} ${t.texto}`;
    }

    if (terminoConVariable.texto !== variableObjetivo) {
        if (terminoConVariable.texto.includes('*')) {
            const partes = terminoConVariable.texto.split('*');
            const coef = partes.find(p => p !== variableObjetivo);
            resultado = `(${resultado}) / (${coef})`;
        }
    }

    if (terminoConVariable.signo === '-') {
        resultado = `-(${resultado})`;
    }

    return resultado;
}

function parsearTerminos(expresion) {
    const terminos = [];
    let actual = '';
    let signo = '+';
    let nivel = 0;

    for (let i = 0; i < expresion.length; i++) {
        const char = expresion[i];

        if (char === '(') { nivel++; actual += char; }
        else if (char === ')') { nivel--; actual += char; }
        else if ((char === '+' || char === '-') && nivel === 0 && actual !== '') {
            terminos.push({ signo, texto: actual });
            signo = char;
            actual = '';
        } else if ((char === '+' || char === '-') && nivel === 0 && actual === '') {
            signo = char;
        } else {
            actual += char;
        }
    }

    if (actual) terminos.push({ signo, texto: actual });

    return terminos;
}

function dividirPorOperadorPrincipal(expresion, operador) {
    let nivel = 0;
    let pos = -1;

    for (let i = expresion.length - 1; i >= 0; i--) {
        const char = expresion[i];

        if (char === ')') nivel++;
        else if (char === '(') nivel--;
        else if (char === operador && nivel === 0) {
            pos = i;
            break;
        }
    }

    if (pos === -1) return [expresion];

    return [expresion.substring(0, pos), expresion.substring(pos + 1)];
}

function extraerFactoresMultiplicacion(expresion) {
    const factores = [];
    let actual = '';
    let nivel = 0;

    for (let i = 0; i < expresion.length; i++) {
        const char = expresion[i];

        if (char === '(') { nivel++; actual += char; }
        else if (char === ')') { nivel--; actual += char; }
        else if (char === '*' && nivel === 0) {
            factores.push(actual);
            actual = '';
        } else {
            actual += char;
        }
    }

    if (actual) factores.push(actual);

    return factores;
}

function procesarFormulaLiteral() {
    const formulaStr = document.getElementById('formulaLiteral').value;
    const resBox = document.getElementById('resFormulaLiteral');
    const errorBox = document.getElementById('mensajeErrorFormula');

    resBox.innerHTML = '';
    errorBox.innerText = '';

    try {
        const partes = formulaStr.split('=');
        if (partes.length !== 2) throw new Error("La fórmula debe contener exactamente un signo '='");

        const ladoIzq = partes[0].trim();
        const ladoDer = partes[1].trim();

        const variables = extractVariables(formulaStr);
        if (variables.length < 2) throw new Error("Se necesitan al menos 2 variables distintas en la fórmula");

        let html = `
            <div class="formula-original"><strong>Fórmula Original:</strong> ${formulaStr}</div>
            <p><strong>Variables detectadas:</strong> ${variables.join(', ')}</p>

            <table>
                <thead>
                    <tr>
                        <th>Variable Despejada</th>
                        <th>Fórmula Resultante</th>
                    </tr>
                </thead>
                <tbody>
        `;

        for (const variable of variables) {
            let formulaDespejada;

            if (variable === ladoIzq) {
                formulaDespejada = `${variable} = ${ladoDer}`;
            } else {
                const resultado = despejarVariable(ladoDer, variable, ladoIzq);
                formulaDespejada = `${variable} = ${resultado}`;
            }

            html += `
                <tr>
                    <td><strong>${variable}</strong></td>
                    <td><pre>${formulaDespejada}</pre></td>
                </tr>
            `;
        }

        html += `
                </tbody>
            </table>

            <div class="nota-didactica">
                <strong>Nota:</strong> Los despejes se generan usando manipulación algebraica directa.
            </div>
        `;

        resBox.innerHTML = html;

    } catch (error) {
        errorBox.innerText = `Error: ${error.message}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    resolverEcuacionParseada();
});
