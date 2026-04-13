ESRO = ESRO or {}
ESRO.Shared = ESRO.Shared or {}

function ESRO.Shared.TableKeys(input)
    local keys = {}

    for key in pairs(input or {}) do
        keys[#keys + 1] = key
    end

    table.sort(keys)

    return keys
end

function ESRO.Shared.FindById(collection, wantedId)
    local targetId = tostring(wantedId or '')

    for _, entry in ipairs(collection or {}) do
        if tostring(entry.id or '') == targetId then
            return entry
        end
    end

    return nil
end

function ESRO.Shared.Clamp(value, minimum, maximum)
    if value < minimum then
        return minimum
    end

    if value > maximum then
        return maximum
    end

    return value
end

function ESRO.Shared.Now()
    return os.time()
end