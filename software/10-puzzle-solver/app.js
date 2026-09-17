import { solve } from "./solver.js";

const numbersInput = document.querySelector("#numbers");
const targetInput = document.querySelector("#target");
const button = document.querySelector("#solve");
const resultArea = document.querySelector("#result");

function runSolver()
{
    const text = numbersInput.value.trim();

    if (!/^[1-9]{4}$/.test(text))
    {
        resultArea.textContent =
            "Enter exactly four digits from 1 to 9.";
        return;
    }

    const numbers = [...text].map(Number);
    const target = Number(targetInput.value);

    if (!Number.isInteger(target))
    {
        resultArea.textContent =
            "Enter an integer target.";
        return;
    }

    const result = solve(numbers, target);

    if (result.solved)
    {
        resultArea.textContent =
            `${result.expression} = ${target}`;
    }
    else
    {
        resultArea.textContent =
            `No solution for ${target}.`;
    }
}

button.addEventListener("click", () =>
{
    runSolver();
});

document.addEventListener("keydown", (event) =>
{
    if (event.key === "Enter")
    {
        runSolver();
    }
});