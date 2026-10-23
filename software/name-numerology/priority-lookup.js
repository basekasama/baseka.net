// Generated from research/web priority modules; do not edit.
(() => {
// Standalone integration component. Uses precomputed Core outputs only.
const VERSION = "priority-mit-20261023.1";

const ordinal = (a, b) => a < b ? -1 : a > b ? 1 : 0;
const compareName = (a, b) => ordinal(a.name, b.name) || ordinal(a.key, b.key);

function validateRecordedSex(recordedSex, language, available) {
    if (!['', 'M', 'F'].includes(recordedSex) || (recordedSex && language !== 'en'))
        throw new TypeError('Recorded sex is unspecified, M or F; US data only.');
    if (recordedSex && !available) throw new Error('Recorded-sex counts are unavailable.');
}

function validateSexData(index, sexData) {
    if (!sexData) return;
    if (index.provenance.language !== 'en' || sexData.version !== 'ssa-recorded-sex-20261020.1' ||
        sexData.sourceSha256.toLowerCase() !== index.provenance.input.sha256.toLowerCase() ||
        !sexData.counts || Object.keys(sexData.counts).length !== index.names.length ||
        index.names.some(n => {
            const c = sexData.counts[n.key];
            return !c || !Number.isSafeInteger(c.m) || !Number.isSafeInteger(c.f) ||
                c.m < 0 || c.f < 0 || c.m + c.f !== n.count;
        })) throw new TypeError('Recorded-sex counts do not match the frozen US index.');
}

function normalizeInitial(value = "")
{
    if (typeof value !== "string")
    {
        throw new TypeError("Initial must be a string.");
    }
    const result = value.trim().normalize("NFKC").toUpperCase();
    if (result !== "" && !/^[A-Z]$/.test(result))
    {
        throw new TypeError("Initial must be empty or one Roman letter A–Z.");
    }
    return result;
}

function outputKey(rule, output)
{
    const valid = value => Number.isInteger(value) &&
        ((value >= 1 && value <= 9) || (rule === "R33" && [11, 22, 33].includes(value)));
    if (!["R0", "R33"].includes(rule) || !output || !valid(output.e) ||
        !(output.s === null || valid(output.s)) || !(output.p === null || valid(output.p)) ||
        (output.s === null && output.p === null))
    {
        throw new TypeError("Specify E/S/P using the selected rule; null is an absent class, not a wildcard.");
    }
    return `E=${output.e}|S=${output.s ?? "-"}|P=${output.p ?? "-"}`;
}

function parseOutputKey(rule, key)
{
    const match = typeof key === "string" && /^E=(\d+)\|S=(\d+|-)\|P=(\d+|-)$/.exec(key);
    if (!match)
    {
        throw new TypeError("Invalid precomputed output key.");
    }
    const output = { e: Number(match[1]), s: match[2] === "-" ? null : Number(match[2]),
        p: match[3] === "-" ? null : Number(match[3]) };
    if (outputKey(rule, output) !== key)
    {
        throw new TypeError("Noncanonical precomputed output key.");
    }
    return output;
}

function referenceSet(references, key)
{
    if (!Array.isArray(references?.[key]) || references[key].some(x => typeof x !== "string" || !x))
    {
        throw new TypeError(`Missing or invalid reference set: ${key}`);
    }
    return new Set(references[key]);
}

/**
 * Input: verified member rows (name, letters, initial, r0, r33; US: nameKey, publishedCount).
 * Never guesses readings, recalculates numerology, or appends reference-only names.
 * The caller must supply rule explicitly, preserving the host application's default.
 */
function createLookup({ language, members, references, population, variants, sexData })
{
    if (!["ja", "en"].includes(language) || !Array.isArray(members) ||
        typeof population !== "string" || !population.trim())
    {
        throw new TypeError("Specify language, member rows, and the source population label.");
    }
    const published = language === "ja" ? referenceSet(references, "published") : new Set();
    if (published.size !== 0)
    {
        throw new TypeError('MIT-only priority references require an empty published array.');
    }
    const selected = language === "ja" ? referenceSet(references, "selected") : new Set();
    const broad = language === "ja" ? referenceSet(references, "broad") : new Set();
    const buckets = { R0: new Map(), R33: new Map() };
    const bBuckets = { R0: new Map(), R33: new Map() };
    const bByKey = new Map((variants?.names??[]).map(n=>[n.key,n]));
    const seen = new Set();
    let strongCount = 0;
    let preferredCount = 0;
    let totalWeight = 0;
    for (const member of members)
    {
        const key = language === "ja" ? member.name : member.nameKey;
        if (typeof member.name !== "string" || !member.name || typeof key !== "string" || !key ||
            seen.has(key) || typeof member.letters !== "string" || !/^[A-Z]+$/.test(member.letters) ||
            member.initial !== member.letters[0])
        {
            throw new TypeError("Invalid, duplicate, or inconsistent member row.");
        }
        seen.add(key);
        const count = language === "ja" ? 1 : member.publishedCount;
        if (!Number.isSafeInteger(count) || count < 1)
        {
            throw new RangeError("Member weight must be a positive safe integer.");
        }
        totalWeight += count;
        if (!Number.isSafeInteger(totalWeight))
        {
            throw new RangeError("Total weight exceeds the safe-integer range.");
        }
        const strong = language === "ja" && selected.has(member.name);
        const preferred = strong || (language === "ja" && broad.has(member.name));
        strongCount += Number(strong);
        preferredCount += Number(preferred);
        const row = Object.freeze({ key, name: member.name, letters: member.letters,
            initial: member.initial, count, tier: strong ? "strong" : preferred ? "supplement" : "other" });
        for (const rule of ["R0", "R33"])
        {
            const z = member[rule.toLowerCase()];
            parseOutputKey(rule, z);
            if (!buckets[rule].has(z))
            {
                buckets[rule].set(z, []);
            }
            buckets[rule].get(z).push(row);
            const b=language==='ja'?bByKey.get(key):null;
            if(b?.letters) {
                const bz=outputKey(rule,b[rule.toLowerCase()]);
                if(!bBuckets[rule].has(bz)) bBuckets[rule].set(bz,[]);
                bBuckets[rule].get(bz).push({row,b});
            }
        }
    }

    function query({ rule, output, initial = "", weighting = language === "ja" ? "Uniform" : "Frequency",
        view = "auto", page = 1, includePassport = false, recordedSex = "" })
    {
        validateRecordedSex(recordedSex, language, Boolean(sexData));
        const z = outputKey(rule, output);
        const normalizedInitial = normalizeInitial(initial);
        if (!["Uniform", "Frequency"].includes(weighting) ||
            (language === "ja" && weighting !== "Uniform") ||
            !["auto", "preferred", "other", "all"].includes(view) ||
            (language === "en" && !["auto", "all"].includes(view)) ||
            !Number.isSafeInteger(page) || page < 1)
        {
            throw new TypeError("Invalid weighting, view, or page.");
        }
        let all = (buckets[rule].get(z) ?? []).filter(row =>
            normalizedInitial === "" || row.initial === normalizedInitial);
        const matches=new Map();
        if(includePassport&&language==='ja') {
            if(!variants) throw new Error('Passport data is unavailable.');
            const union=new Map(all.map(row=>[row.key,row]));
            for(const row of all) matches.set(row.key,[{mode:'A',letters:row.letters,initial:row.initial}]);
            for(const {row,b} of bBuckets[rule].get(z)??[]) {
                if(normalizedInitial&&b.initial!==normalizedInitial) continue;
                union.set(row.key,row);
                if(!matches.has(row.key)) matches.set(row.key,[]);
                matches.get(row.key).push({mode:'B',letters:b.letters,initial:b.initial});
            }
            all=[...union.values()];
        }
        if (recordedSex) all = all.map(row => ({...row, count: sexData.counts[row.key][recordedSex.toLowerCase()]})).filter(row => row.count > 0);
        const matchingWeight = all.reduce((sum, row) => sum + row.count, 0);
        const preferred = language === "ja" ? all.filter(row => row.tier !== "other") : [];
        const other = language === "ja" ? all.filter(row => row.tier === "other") : [];
        const resolvedView = view === "auto"
            ? (language === "ja" && preferred.length > 0 ? "preferred" : "all") : view;
        const displayed = resolvedView === "preferred" ? preferred : resolvedView === "other" ? other : all;
        const ordered = [...displayed].sort((a, b) =>
        {
            if (language === "en")
            {
                return (weighting === "Frequency" ? b.count - a.count : 0) || ordinal(a.key, b.key);
            }
            if (resolvedView === "preferred")
            {
                return Number(b.tier === "strong") - Number(a.tier === "strong") || compareName(a, b);
            }
            return compareName(a, b);
        });
        // Japanese priority presentation: no truncation at 25; larger sets use 20/page.
        // Keep the old US 50/page convention, with shares based on the entire matching set.
        const pageSize = language === "ja" ? (ordered.length <= 25 ? 25 : 20) : 50;
        const pageCount = Math.max(1, Math.ceil(ordered.length / pageSize));
        const actualPage = Math.min(page, pageCount);
        const start = (actualPage - 1) * pageSize;
        const candidates = ordered.slice(start, start + pageSize).map(row =>
        {
            const candidate = { key: row.key, name: row.name, letters: row.letters, initial: row.initial };
            if (language === "ja")
            {
                candidate.tier = row.tier;
                if(includePassport) candidate.matches=matches.get(row.key);
            }
            else
            {
                candidate.count = row.count;
                candidate.dictionaryConditionalShare = weighting === "Frequency"
                    ? row.count / matchingWeight : 1 / all.length;
            }
            return candidate;
        });
        return {
            version: VERSION, language, population, rule, output: { ...output }, initial: normalizedInitial,
            weighting, view: resolvedView, allCount: all.length,
            preferredCount: language === "ja" ? preferred.length : null,
            otherCount: language === "ja" ? other.length : null,
            matchingWeight, viewCount: ordered.length, page: actualPage, pageSize, pageCount,
            shownFrom: candidates.length ? start + 1 : 0, shownTo: start + candidates.length,
            hasPrevious: actualPage > 1, hasNext: actualPage < pageCount,
            status: all.length === 0 ? "no-dictionary-match"
                : language === "ja" && preferred.length === 0 ? "no-priority-match" : "matches",
            candidates,
            interpretation: language === "ja"
                ? "Priority is reference membership, not population frequency or identification probability. Other dictionary matches remain available."
                : recordedSex ? "Shares are conditional on this source cohort, recorded sex, initial and numerology output, not current-population identification probabilities."
                : "Shares are conditional on this source cohort, initial and numerology output, not current-population identification probabilities.",
            ...(recordedSex ? {recordedSex} : {})
        };
    }

    return Object.freeze({ query, metadata: Object.freeze({ version: VERSION, language, population,
        memberCount: members.length, totalWeight,
        strongCount: language === "ja" ? strongCount : null,
        preferredCount: language === "ja" ? preferredCount : null }) });
}


// Adapter for the actual schemaVersion=1 research index available in this workspace.
// Integration with the newer App/Web client asset schema must be checked against its source.
function createLookupFromIndex(index, references, variants, sexData)
{
    const language = index?.provenance?.language;
    if (index?.schemaVersion !== "1" || !["ja", "en"].includes(language) || !Array.isArray(index.names) ||
        typeof index.provenance.population !== "string" ||
        (language === "en" && index.provenance.frequencyAvailable !== true))
    {
        throw new TypeError("Unsupported legacy index schema, language, or frequency metadata.");
    }
    const members = index.names.map(row => ({ name: row.name, nameKey: row.key, letters: row.letters,
        initial: row.initials?.roman, publishedCount: row.count }));
    for (const rule of ["R0", "R33"])
    {
        const groups = index.buckets?.[rule];
        if (!groups || typeof groups !== "object" || Array.isArray(groups))
        {
            throw new TypeError("Missing legacy rule buckets.");
        }
        const used = new Set();
        for (const [z, ids] of Object.entries(groups))
        {
            if (!Array.isArray(ids))
            {
                throw new TypeError("Invalid bucket member list.");
            }
            for (const id of ids)
            {
                if (!Number.isInteger(id) || id < 0 || id >= members.length || used.has(id))
                {
                    throw new TypeError("Invalid or repeated legacy member reference.");
                }
                used.add(id);
                members[id][rule.toLowerCase()] = z;
            }
        }
        if (used.size !== members.length)
        {
            throw new TypeError("Legacy index omitted a member from a rule.");
        }
    }
    if(variants && (language!=='ja'||variants.names.length!==members.length||variants.names.some((n,i)=>n.key!==index.names[i].key)))
        throw new TypeError('Variant reading keys do not match the fixed index.');
    validateSexData(index, sexData);
    return createLookup({ language, members, references, population: index.provenance.population, variants, sexData });
}


// Uses the fixed buckets and saved calculation initials. Does not infer possible names or recalculate numbers.
function createExplorer(index, variants, sexData)
{
    validateSexData(index, sexData);
    const groups = Object.fromEntries(['R0', 'R33'].map(rule => [rule,
        Object.entries(index.buckets[rule]).map(([key, ids]) =>
        {
            const counts = new Map([['', ids.length]]);
            for (const id of ids)
            {
                const initial = index.names[id].letters[0];
                counts.set(initial, (counts.get(initial) ?? 0) + 1);
            }
            if (sexData) for (const sex of ['M','F']) {
                const eligible = ids.filter(id => sexData.counts[index.names[id].key][sex.toLowerCase()] > 0);
                counts.set(sex + ':', eligible.length);
                for (const id of eligible) {
                    const key = sex + ':' + index.names[id].letters[0];
                    counts.set(key, (counts.get(key) ?? 0) + 1);
                }
            }
            return { output: parseOutputKey(rule, key), counts };
        }).sort((a, b) => a.output.e - b.output.e || (a.output.s ?? 0) - (b.output.s ?? 0) || (a.output.p ?? 0) - (b.output.p ?? 0))]));
    const bothGroups=variants ? Object.fromEntries(['R0','R33'].map(rule=>[rule,
        [...new Set([...Object.keys(index.buckets[rule]),...Object.keys(variants.buckets[rule])])].map(key=>{
            const sets=new Map([['',new Set()]]);
            const add=(id,initial)=>{sets.get('').add(id);if(!sets.has(initial))sets.set(initial,new Set());sets.get(initial).add(id);};
            for(const id of index.buckets[rule][key]??[]) add(id,index.names[id].letters[0]);
            for(const id of variants.buckets[rule][key]??[]) add(id,variants.names[id].initial);
            return {output:parseOutputKey(rule,key),counts:new Map([...sets].map(([k,s])=>[k,s.size]))};
        }).sort((a,b)=>a.output.e-b.output.e||(a.output.s??0)-(b.output.s??0)||(a.output.p??0)-(b.output.p??0))])):groups;
    return { query({ rule, initial = '', component = '', value = '', page = 1, includePassport = false, recordedSex = "" })
    {
        if (!['R0', 'R33'].includes(rule) || !['', 'E', 'S', 'P'].includes(component) ||
            !Number.isInteger(page) || page < 1 || typeof value !== 'string' ||
            (component === '' && value !== '') || (component === 'E' && value === '-'))
        {
            throw new TypeError('Invalid exploration condition.');
        }
        validateRecordedSex(recordedSex, index.provenance.language, Boolean(sexData));
        const normalized = normalizeInitial(initial);
        const countKey = recordedSex ? recordedSex + ":" + normalized : normalized;
        const all = (includePassport?bothGroups:groups)[rule].filter(g => (g.counts.get(countKey) ?? 0) > 0)
            .map(g => ({ output: g.output, allCount: g.counts.get(countKey) }));
        const part = row => String(row.output[component.toLowerCase()] ?? '-');
        const availableValues = component === '' ? [] : [...new Set(all.map(part))]
            .sort((a, b) => (a === '-' ? 0 : Number(a)) - (b === '-' ? 0 : Number(b)));
        if (value !== '' && !availableValues.includes(value))
        {
            throw new TypeError('Choose a value present in this dictionary and initial.');
        }
        const filtered = value === '' ? all : all.filter(row => part(row) === value);
        const pageCount = Math.max(1, Math.ceil(filtered.length / 20));
        const actualPage = Math.min(page, pageCount), start = (actualPage - 1) * 20;
        const rows = filtered.slice(start, start + 20);
        return { language: index.provenance.language, rule, initial: normalized, component, value, availableValues,
            totalGroups: filtered.length, matchingNames: filtered.reduce((s, row) => s + row.allCount, 0),
            page: actualPage, pageCount, shownFrom: rows.length ? start + 1 : 0, shownTo: start + rows.length,
            hasPrevious: actualPage > 1, hasNext: actualPage < pageCount, rows, ...(recordedSex ? {recordedSex} : {}) };
    } };
}

globalThis.NumerologyPriority = { createLookupFromIndex, normalizeInitial, createExplorer };
})();
