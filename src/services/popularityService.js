import { loadChartScatter, loadChartBubble, loadChartBar, clearChart } from '../plot';

export async function getPopularity(games) {
    const data = await getPopularityData(games);

    const criticBtn  = document.querySelector('#criticBtn');
    const priceBtn  = document.querySelector('#priceBtn');
    const top10Btn = document.querySelector('#top10Btn');
    const clearBtn = document.querySelector('#clearBtn');

    if (!criticBtn || !priceBtn || !top10Btn) {
        return;
    }

    criticBtn.addEventListener('click', async () => {
        clearChart();
        await loadChartScatter(data.criticData);
    });

    priceBtn.addEventListener('click', async () => {
        clearChart();
        await loadChartBubble(data.priceAndOwnersData);
    });

    top10Btn.addEventListener('click', async () => {
        clearChart();
        await loadChartBar(data.genreAndPopularityData, (genre) => top10ByGenre(games, genre));
    })

    clearBtn.addEventListener('click', async () => {
        clearChart();
    });
}

async function getPopularityData(games) {
    const criticQuery = `
            SELECT "Name" as name, 
            "Metacritic score" as metacritic_score, 
            "Average playtime forever" as average_playtime_forever
            FROM games
            WHERE metacritic_score <> 0 
                AND average_playtime_forever <> 0
                order by average_playtime_forever desc
            LIMIT 100
        `;  
    
        const criticData = await games.query(criticQuery);
      

         const priceAndOwnersQuery = `
            SELECT 
            "Estimated owners" as estimated_owners, 
            avg("Price") as price, 
            avg("Average playtime forever") as average_playtime_forever 
            from games 
            group by estimated_owners 
        `;  

        const priceAndOwnersData = await games.query(priceAndOwnersQuery);

    
        const genreAndPopularityQuery = `
            SELECT 
                    trim(genre) as genre,
                    avg("Average playtime forever") as average_playtime_forever,
                    AVG((
                CAST(split_part(replace("Estimated owners", ',', ''), ' - ', 1) AS DOUBLE) +
                CAST(split_part(replace("Estimated owners", ',', ''), ' - ', 2) AS DOUBLE)
                ) / 2) AS avg_estimated_owners,
                    avg("Peak CCU") as peak_ccu
                FROM (
                    SELECT unnest(string_split("Genres", ',')) as genre,
                    "Average playtime forever",
                    "Estimated owners",
                    "Peak CCU"
                
                    FROM games
                )
            GROUP BY trim(genre),
            order by avg_estimated_owners desc
            limit 10
        `;      
       

        const genreAndPopularityData = await games.query(genreAndPopularityQuery); 

        return {
            criticData,
            priceAndOwnersData,
            genreAndPopularityData
        }
}

async function top10ByGenre(games, genre) {
    clearChart();

    const top10ByGenre = `
        SELECT 
            "Name" as name,
            "Average playtime forever" as average_playtime_forever,
            (
        CAST(split_part(replace("Estimated owners", ',', ''), ' - ', 1) AS DOUBLE) +
        CAST(split_part(replace("Estimated owners", ',', ''), ' - ', 2) AS DOUBLE)
        ) / 2 AS avg_estimated_owners,
            "Peak CCU" as peak_ccu
        FROM games
        where "Genres" like '%${genre}%'
        order by avg_estimated_owners desc
        limit 10
    `;


    const top10 = await games.query(top10ByGenre); 
    loadChartBar(top10);
}

