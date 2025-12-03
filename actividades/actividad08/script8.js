class Calculator {
      constructor() {
        this.variablesInput = document.getElementById('variables');
        this.equationsInput = document.getElementById('equations');
        this.calculateButton = document.getElementById('calculate-btn');
        this.resultDiv = document.getElementById('result');
        this.init();
      }

      init() {
        this.calculateButton.addEventListener('click', () => this.calculate());
        this.variablesInput.addEventListener('keydown', e => {
          if (e.key === 'Enter' && e.ctrlKey) this.calculate();
        });
        this.equationsInput.addEventListener('keydown', e => {
          if (e.key === 'Enter' && e.ctrlKey) this.calculate();
        });
      }

      parseVariables(variablesText) {
        const variables = {};
        const lines = variablesText.split('\n').filter(line => line.trim());
        for (const line of lines) {
          const parts = line.split(',').map(p => p.trim()).filter(Boolean);
          for (const part of parts) {
            const match = part.match(/^(\w+)\s*=\s*(.+)$/);
            if (match) {
              const [, varName, value] = match;
              variables[varName.trim()] = this.evaluateExpression(value.trim(), variables);
            } else {
              variables[part] = 0;
            }
          }
        }
        return variables;
      }

      evaluateExpression(expression, variables) {
        if (!/^[a-zA-Z0-9+\-*/().\s^]+$/.test(expression)) {
          throw new Error(`Expresión no válida: ${expression}`);
        }
        let expr = expression.replace(/\^/g, '**');
        for (const [name, val] of Object.entries(variables)) {
          expr = expr.replace(new RegExp(`\\b${name}\\b`, 'g'), val);
        }
        if (/[a-zA-Z]/.test(expr)) {
          throw new Error(`Variables sin definir en: ${expr}`);
        }
        return Function(`"use strict"; return (${expr})`)();
      }

      calculate() {
        try {
          const variables = this.parseVariables(this.variablesInput.value.trim());
          const equations = this.equationsInput.value.trim().split('\n').filter(Boolean);
          const results = [];
          for (const eq of equations) {
            const match = eq.match(/^(\w+)\s*=\s*(.+)$/);
            if (match) {
              const [, resultVar, expr] = match;
              variables[resultVar] = this.evaluateExpression(expr, variables);
              results.push(`${resultVar} = ${variables[resultVar]}`);
            } else {
              results.push(`${eq} = ${this.evaluateExpression(eq, variables)}`);
            }
          }
          this.showResult(results.join('\n'), results.length ? 'success' : 'warning');
        } catch (err) {
          this.showResult(`Error: ${err.message}`, 'error');
        }
      }

      showResult(msg, type) {
        this.resultDiv.textContent = msg;
        this.resultDiv.className = `result-content result-${type}`;
      }
    }

    document.addEventListener('DOMContentLoaded', () => new Calculator());