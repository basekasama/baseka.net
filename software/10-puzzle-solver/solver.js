function gcd(a, b)
{
    a = Math.abs(a);
    b = Math.abs(b);

    while (b !== 0)
    {
        const t = a % b;
        a = b;
        b = t;
    }

    return a;
}

function makeValue(n, d, expr)
{
    if (d === 0)
    {
        return null;
    }

    if (d < 0)
    {
        n = -n;
        d = -d;
    }

    const g = gcd(n, d);

    return {
        n: n / g,
        d: d / g,
        expr
    };
}

function add(a, b)
{
    return makeValue(
        a.n * b.d + b.n * a.d,
        a.d * b.d,
        `(${a.expr} + ${b.expr})`
    );
}

function sub(a, b)
{
    return makeValue(
        a.n * b.d - b.n * a.d,
        a.d * b.d,
        `(${a.expr} - ${b.expr})`
    );
}

function mul(a, b)
{
    return makeValue(
        a.n * b.n,
        a.d * b.d,
        `(${a.expr} × ${b.expr})`
    );
}

function div(a, b)
{
    if (b.n === 0)
    {
        return null;
    }

    return makeValue(
        a.n * b.d,
        a.d * b.n,
        `(${a.expr} ÷ ${b.expr})`
    );
}

function search(values, target)
{
    if (values.length === 1)
    {
        const v = values[0];

        if (v.n === target * v.d)
        {
            return v.expr;
        }

        return null;
    }

    for (let i = 0; i < values.length; i++)
    {
        for (let j = i + 1; j < values.length; j++)
        {
            const a = values[i];
            const b = values[j];

            const rest = [];

            for (let k = 0; k < values.length; k++)
            {
                if (k !== i && k !== j)
                {
                    rest.push(values[k]);
                }
            }

            const nextValues = [
                add(a, b),
                sub(a, b),
                sub(b, a),
                mul(a, b),
                div(a, b),
                div(b, a)
            ];

            for (const next of nextValues)
            {
                if (next === null)
                {
                    continue;
                }

                const result = search([...rest, next], target);

                if (result !== null)
                {
                    return result;
                }
            }
        }
    }

    return null;
}

export function solve(numbers, target = 10)
{
    const values = numbers.map(x =>
    {
        return makeValue(x, 1, String(x));
    });

    const expression = search(values, target);

    return {
        solved: expression !== null,
        expression
    };
}