<template>
  <div class="wrapper">
    <Header />
    <main>
      <section class="title-section">
        <h1>Data Bio</h1>
        <p>A retrospective of the last {{ weeks.length }} weeks:</p>
        <div class="life">
          <div class="week" :class="`geo-${week.geo}`" v-for="(week, index) in weeks" :key="index">
            <span class="icon" v-if="(weeks.length - index) % 52 == 0">&#127874;</span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import Header from './_includes/header.vue'
import './css/life.css'

const weeksSince = (date) => {
  if (isNaN(date)) return 0;

  const today = new Date()
  const diff = today - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  return Math.floor(days / 7)
}

// Add a layer for physical location
const locations = [
  {
    start: "1990-05-11",
    end: "2008-08-27",
    location: "Manatee",
  },
  {
    start: "2023-01-04",
    end: "2023-01-26",
    location: "Travel" // Thailand, Singapore, Tokyo
  },
  {
    start: "2022-05-20",
    end: "2022-06-04",
    location: "Travel" // Spain, Italy, London
  },
  {
    start: "2011-06-24",
    end: "2011-08-23",
    location: "Travel" // Seoul; travel supercedes Philly range
  },
  {
    start: "2013-11-13",
    end: "2013-11-28",
    location: "Travel" // Chile + Argentina
  },
  {
    start: "2014-12-25",
    end: "2015-01-04",
    location: "Travel" // Scotland + London
  },
  {
    start: "2019-05-24",
    end: "2019-06-09",
    location: "Travel" // Turkey, Hungary, Czech Republic, Berlin
  },
  {
    start: "2018-12-07",
    end: "2018-12-27",
    location: "Travel" // YTT in Bali
  },
  {
    start: "2017-11-17",
    end: "2017-11-26",
    location: "Travel" // Berlin and Israel
  },
  {
    start: "2016-12-29",
    end: "2017-01-13",
    location: "Travel" // Guatemala
  },
  {
    start: "2008-08-27",
    end: "2012-05-25",
    location: "Philly",
  },
  {
    start: "2012-05-25",
    end: "2012-06-25",
    location: "Travel" // China
  },
  {
    start: "2012-07-01",
    end: "2013-04-17",
    location: "DC"
  },
  {
    start: "2013-04-21",
    end: "2014-05-09",
    location: "Travel"
  },
  {
    start: "2014-05-09",
    end: "2020-08-31",
    location: "NYC"
  },
  {
    start: "2020-08-29",
    end: "2021-02-27",
    location: "Vegas"
  },
  {
    start: "2021-03-07",
    end: "2021-04-25",
    location: "Austin"
  },
  {
    start: "2021-05-02",
    location: "NYC"
  }
]

const buildGeoIndex = () => {
  const indices = {}
  locations.map(({ start, end, location }) => {
    const x = weeksSince(new Date(end))
    const y = weeksSince(new Date(start))

    indices[[x, y]] = location
  })

  return indices;
}

const GEO_INDEX = buildGeoIndex();

// Check if week is in between any range in geo data set
const getGeo = (i) => {
  for (const range of Object.keys(GEO_INDEX)) {
    const [x, y] = range.split(',')
    if (i >= x && i <= y) {
      return GEO_INDEX[[x, y]]
    }
  }
}

const weeks = []
for (let i = 0; i < weeksSince(new Date("1990-05-11")); i++) {
  weeks.push({
    geo: getGeo(i)?.toLowerCase()
  })
}

export default {
  data: () => ({
    weeks,
  }),
  components: {
    Header
  }
}
</script>

<style>
.wrapper {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  width: 100%;
  max-width: 940px;
  padding: 0 4vw;
}

main {
  position: relative;
  min-height: 100vh;
  background: var(--color-background);
}

.life {
  display: flex;
  flex-wrap: wrap;
}

.week {
  display: flex;
  width: 42px;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  /* margin: 10px 0 0 10px; */
}

.week::after {
  content: "";
  display: inline-block;
  border-radius: 50%;
  height: 30px;
  width: 30px;
  border: 2px solid var(--color-black);
  z-index: 0;
}

.icon {
  display: inline-block;
  position: absolute;
}

/* Color Palattes for Life Project */

/* Geo Layer
 * Inspired by the Olympic Color Palatte
 */

:root {
  --olympic-blue: #0078D0;
  --olympic-yellow: #FFB114;
  --olympic-green: #00A651;
  --olympic-red: #F0282D;
  --olympic-orange: #FA841E;
}

.geo-nyc::after {
  border-color: var(--olympic-blue);
}

.geo-philly::after {
  border-color: var(--olympic-green);
}

.geo-dc::after {
  border-color: var(--olympic-yellow);
}

.geo-austin::after,
.geo-vegas::after {
  border-color: var(--olympic-orange);
}

.geo-manatee::after {
  border-color: var(--olympic-red);
}

.geo-travel::after {
  border-style: dotted;
}
</style>
