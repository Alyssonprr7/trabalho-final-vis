import {loadGenreRentationChart, loadPriceTimePieChart, loadCriticRentationLineChart, clearChart } from '../plot';

export async function getLongevity(games) {
    const data = await getLongevityData(games);

    const genreRentation = document.querySelector('#genreRentationBtn');
    const priceAndGameTime  = document.querySelector('#priceAndGameTimeBtn');
    const metacriticAndRentation = document.querySelector('#metacriticAndRentationBtn');
    const clearBtn = document.querySelector('#clearBtn');
    
    if (!genreRentation || !priceAndGameTime || !metacriticAndRentation) {
        return;
    }

    genreRentation.addEventListener('click', async () => {
        clearChart();
        await loadGenreRentationChart(data.genreRentationData, games);
    });

    priceAndGameTime.addEventListener('click', async () => {
        clearChart();
        await loadPriceTimePieChart(data.relationPriceTimeData, data.getGamesByPriceRange);
    });

    metacriticAndRentation.addEventListener('click', async () => {
        clearChart();
        await loadCriticRentationLineChart(data.criticRentationData);
    })

    clearBtn.addEventListener('click', async () => {
        clearChart();
    });
}

async function getLongevityData(games) {

    // Query Gêneros que retêm jogadores por mais tempo
        const genreRentationQuery = `
            SELECT
                trim(genre) as genre,
                ROUND(AVG("Average playtime forever") / 60, 2) as tempo_medio_jogado_horas
            FROM (
                SELECT 
                    unnest(string_split("Genres", ',')) as genre,
                    "Average playtime forever"
                FROM games
                WHERE "Average playtime forever" > 0
                AND "Genres" NOT LIKE '%Utilities%'
                AND "Genres" NOT LIKE '%Video%'
                AND "Genres" NOT LIKE '%Education%'
                AND "Genres" NOT LIKE '%Training%'
                AND "Genres" NOT LIKE '%Audio%'
                AND "Genres" NOT LIKE '%Photo%'
                AND "Genres" NOT LIKE '%Design%'
                AND "Genres" NOT LIKE '%Web%'
                AND "Genres" NOT LIKE '%Animation%'
            )
            GROUP BY trim(genre)
            ORDER BY tempo_medio_jogado_horas DESC
            LIMIT 12
    `;

    const genreRentationData = await games.query(genreRentationQuery);
    
    //Relação entre preço e tempo de jogo
    const relationPriceTimeQuery = `
        SELECT
            CASE
                WHEN "Price" <= 10 THEN 'R$ 0–10'
                WHEN "Price" <= 30 THEN 'R$ 11–30'
                WHEN "Price" <= 60 THEN 'R$ 31–60'
                ELSE 'R$ 61+'
            END AS faixa_preco,
            ROUND(AVG("Average playtime forever") / 60.0, 2) AS media_horas_jogadas,
            CAST(COUNT(*) AS int) AS quantidade_jogos
        FROM games
            WHERE "Price" > 0 AND "Genres" NOT LIKE '%Utilities%'
            AND "Genres" NOT LIKE '%Video%'
            AND "Genres" NOT LIKE '%Education%'
            AND "Genres" NOT LIKE '%Training%'
            AND "Genres" NOT LIKE '%Audio%'
            AND "Genres" NOT LIKE '%Photo%'
            AND "Genres" NOT LIKE '%Design%'
            AND "Genres" NOT LIKE '%Web%'
            AND "Genres" NOT LIKE '%Animation%'
        GROUP BY
            faixa_preco
        ORDER BY
            CASE
                WHEN faixa_preco = 'R$ 0–10' THEN 1
                WHEN faixa_preco = 'R$ 11–30' THEN 2
                WHEN faixa_preco = 'R$ 31–60' THEN 3
                ELSE 4
            END;
    `
    const relationPriceTimeData = await games.query(relationPriceTimeQuery);

    // Avaliação da crítica e seu impacto na retenção
    const criticRentationQuery = `
        SELECT 
            CASE
                WHEN "Metacritic score" >= 90 THEN 'Excelente (90-100)'
                WHEN "Metacritic score" >= 80 THEN 'Muito Bom (80-89)'
                WHEN "Metacritic score" >= 70 THEN 'Bom (70-79)'
                WHEN "Metacritic score" >= 60 THEN 'Regular (60-69)'
                ELSE 'Ruim (< 60)'
            END AS faixa_avaliacao,
            ROUND(AVG("Metacritic score"), 2) as media_metacritic,
            ROUND(AVG("Average playtime forever") / 60.0, 2) as media_horas_jogadas,
            ROUND(AVG("Peak CCU"), 0) as media_pico_jogadores_ativo_simultaneamente
        FROM games
        WHERE "Metacritic score" > 0
            AND "Average playtime forever" > 0
            AND "Genres" NOT LIKE '%Utilities%'
            AND "Genres" NOT LIKE '%Video%'
            AND "Genres" NOT LIKE '%Education%'
            AND "Genres" NOT LIKE '%Training%'
            AND "Genres" NOT LIKE '%Audio%'
            AND "Genres" NOT LIKE '%Photo%'
            AND "Genres" NOT LIKE '%Design%'
            AND "Genres" NOT LIKE '%Web%'
            AND "Genres" NOT LIKE '%Animation%'
        GROUP BY faixa_avaliacao
        ORDER BY 
            CASE
                WHEN faixa_avaliacao = 'Excelente (90-100)' THEN 1
                WHEN faixa_avaliacao = 'Muito Bom (80-89)' THEN 2
                WHEN faixa_avaliacao = 'Bom (70-79)' THEN 3
                WHEN faixa_avaliacao = 'Regular (60-69)' THEN 4
                ELSE 5
            END;
    `

    const criticRentationData = await games.query(criticRentationQuery);

    // Função para buscar jogos por faixa de preço na hora
    async function getGamesByPriceRange(faixaPreco) {
        let priceCondition;
        switch(faixaPreco) {
            case 'R$ 0–10':
                priceCondition = '"Price" <= 10';
                break;
            case 'R$ 11–30':
                priceCondition = '"Price" > 10 AND "Price" <= 30';
                break;
            case 'R$ 31–60':
                priceCondition = '"Price" > 30 AND "Price" <= 60';
                break;
            case 'R$ 61+':
                priceCondition = '"Price" > 60';
                break;
            default:
                return [];
        }

        const gamesByPriceQuery = `
            SELECT 
                "Name" as nome,
                ROUND("Average playtime forever" / 60.0, 2) as tempo_medio_horas,
                "Price" as preco
            FROM games
            WHERE ${priceCondition}
                AND "Average playtime forever" > 0
                AND "Genres" NOT LIKE '%Utilities%'
                AND "Genres" NOT LIKE '%Video%'
                AND "Genres" NOT LIKE '%Education%'
                AND "Genres" NOT LIKE '%Training%'
                AND "Genres" NOT LIKE '%Audio%'
                AND "Genres" NOT LIKE '%Photo%'
                AND "Genres" NOT LIKE '%Design%'
                AND "Genres" NOT LIKE '%Web%'
                AND "Genres" NOT LIKE '%Animation%'
            ORDER BY "Average playtime forever" DESC
            LIMIT 5
        `;

        return await games.query(gamesByPriceQuery);
    }

    return {
        genreRentationData,
        relationPriceTimeData,
        criticRentationData,
        getGamesByPriceRange
    }
}

// Função para buscar jogos por gênero
export async function getGamesByGenre(games, genre) {
    const gamesByGenreQuery = `
        SELECT 
            "Name" as nome,
            ROUND("Average playtime forever" / 60.0, 2) as tempo_medio_horas,
            "Price" as preco
        FROM games
        WHERE "Average playtime forever" > 0
            AND "Genres" LIKE '%${genre}%'
            AND "Genres" NOT LIKE '%Utilities%'
            AND "Genres" NOT LIKE '%Video%'
            AND "Genres" NOT LIKE '%Education%'
            AND "Genres" NOT LIKE '%Training%'
            AND "Genres" NOT LIKE '%Audio%'
            AND "Genres" NOT LIKE '%Photo%'
            AND "Genres" NOT LIKE '%Design%'
            AND "Genres" NOT LIKE '%Web%'
            AND "Genres" NOT LIKE '%Animation%'
        ORDER BY "Average playtime forever" DESC
        LIMIT 5
    `;
    return await games.query(gamesByGenreQuery);
}