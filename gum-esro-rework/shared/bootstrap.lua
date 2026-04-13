ESRO = ESRO or {}
ESRO.Shared = ESRO.Shared or {}

local function deepCopy(value)
    if type(value) ~= 'table' then
        return value
    end

    local copy = {}
    for key, entry in pairs(value) do
        copy[key] = deepCopy(entry)
    end

    return copy
end

function ESRO.Shared.Clone(value)
    return deepCopy(value)
end

function ESRO.Shared.Merge(base, extra)
    local merged = deepCopy(base or {})

    for key, value in pairs(extra or {}) do
        if type(value) == 'table' and type(merged[key]) == 'table' then
            merged[key] = ESRO.Shared.Merge(merged[key], value)
        else
            merged[key] = deepCopy(value)
        end
    end

    return merged
end