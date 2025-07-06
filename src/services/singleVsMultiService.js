import { loadChartPlaytimeByMode, loadChartPriceRangeByMode, loadChartRatingByMode, clearChart } from '../plot';

export async function getSingleVsMulti(games) {
    const data = await getSingleVsMultiData(games);

    const playtimeBtn  = document.querySelector('#playtimeBtn');
    const priceRangeBtn  = document.querySelector('#priceRangeBtn');
    const ratingBtn = document.querySelector('#ratingBtn');
    const clearBtn = document.querySelector('#clearBtn');

    if (!playtimeBtn || !priceRangeBtn || !ratingBtn) {
        return;
    }

    playtimeBtn.addEventListener('click', async () => {
        clearChart();
        await loadChartPlaytimeByMode(data.playtimeData);
    });

    priceRangeBtn.addEventListener('click', async () => {
        clearChart();
        await loadChartPriceRangeByMode(data.priceRangeData);
    });

    ratingBtn.addEventListener('click', async () => {
        clearChart();
        await loadChartRatingByMode(data.ratingData);
    });

    clearBtn.addEventListener('click', async () => {
        clearChart();
    });
} 

async function getSingleVsMultiData(games) {
    const playtimeQuery = `
    SELECT 
        CASE 
            WHEN "Genres" LIKE '%Massively Multiplayer%' THEN 'Multiplayer' 
            ELSE 'Single Player' 
        END AS mode,
        AVG("Average playtime forever") / 60 AS avg_playtime_hours
    FROM (
        SELECT *
        FROM games
        WHERE "Average playtime forever" > 0
        ORDER BY "Average playtime forever" DESC
        LIMIT 3000
    ) AS filtered_games
    GROUP BY mode;
    `

    const playtimeData = await games.query(playtimeQuery);

    const priceRangeQuery = `
    SELECT
        CASE
            WHEN "Categories" LIKE '%Multi-player%' THEN 'Multiplayer'
            ELSE 'Single Player'
        END AS mode,
        CASE
            WHEN "Price" = 0 THEN 'Free'
            WHEN "Price" <= 10 THEN 'Até R$10'
            WHEN "Price" <= 30 THEN 'R$10–30'
            WHEN "Price" <= 60 THEN 'R$30–60'
            ELSE 'Acima de R$60'
        END AS price_range,
        COUNT(*) AS quantidade,
        CASE
            WHEN "Price" = 0 THEN 0
            WHEN "Price" <= 10 THEN 1
            WHEN "Price" <= 30 THEN 2
            WHEN "Price" <= 60 THEN 3
            ELSE 4
        END AS faixa_ordem
    FROM games
    GROUP BY mode, price_range, faixa_ordem
    ORDER BY faixa_ordem, mode;
    `

    const priceRangeData = await games.query(priceRangeQuery);

    const ratingQuery = `
    SELECT
        CASE 
            WHEN "Genres" LIKE '%Massively Multiplayer%' THEN 'Multiplayer' 
            ELSE 'Single Player' 
        END AS mode,
        SUM("Positive") AS total_positives,
        SUM("Negative") AS total_negatives
    FROM games
    WHERE "Positive" + "Negative" > 0
    GROUP BY mode;
    `

    const ratingData = await games.query(ratingQuery);

    return {playtimeData, priceRangeData, ratingData};
}

