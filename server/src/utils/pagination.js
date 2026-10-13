/**
 * Normalizes ?page= and ?limit= into safe values, and builds the
 * { page, totalPages, total } envelope the spec's section 9 requires.
 */
const getPagination = (query) => {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    const buildMeta = (total) => ({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
    });

    return { page, limit, skip, buildMeta };
};

module.exports = getPagination;
