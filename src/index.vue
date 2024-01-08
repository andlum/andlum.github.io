<template>
  <div class="wrapper">
    <Header />
    <main>
      <section class="title-section">
        <h1 class="animate-fade-up">Hello! I'm Andrew <span class="animate-wave animate-delay--2">&#128075;</span></h1>
        <p class="tagline animate-fade-up animate-delay">I'm a product engineer based in NYC.</p>
      </section>
      <section class="about-row">
        <h2 class="section-header header-2">Currently</h2>
        <p>Building delightful digital products and experiences with small businesses. I'm currently available for
          part-time freelance work.</p>
        <p>
          If you'd like to get in touch, you can send an electronic letter to: hello&nbsp;[at]&nbsp;andlum.com
        </p>
      </section>
      <section class="about-row">
        <h2 class="section-header header-2">Previously</h2>
        <p>I worked on payments and built delightful interfaces at <a class="fancy-link"
            href="https://www.justworks.com/">Justworks</a>, build tools to
          enable location-based features <a class="fancy-link" href="https://radar.com/">Radar</a>, and leveraged
          technology to decarbonize the ocean supply chain at <a class="fancy-link"
            href="https://nautiluslabs.com/">Nautilus
            Labs</a>.</p>
      </section>
    </main>
  </div>
</template>

<script>
import Header from './_includes/header.vue'

export default {
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

.fancy-link {
  background-image: linear-gradient(var(--color-blue), var(--color-blue));
  background-size: 0% 6px;
  background-position: left bottom;
  background-repeat: no-repeat;
  transition: background-size 300ms ease;
}

.fancy-link:hover {
  color: var(--color-body-text);

  background-size: 100% 6px;
}

.title-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-top: 2rem;
}

.section-header {
  font-size: 1em;
  font-weight: 700;
  margin: 2em 0 0.5em;
}

.tagline {
  margin: 0;
}

p {
  margin: 0;
}

p+p {
  margin-top: 1em;
}

.animate-delay {
  animation-delay: 500ms;
}

.animate-delay--2 {
  animation-delay: 2s;
}

.animate-fade-up {
  opacity: 1;
  animation-fill-mode: backwards;
  animation-name: fade-up;
  animation-duration: 1.5s;
}

@keyframes fade-up {
  from {
    transform: translate3d(0, 40px, 0);
    opacity: 0;
  }

  to {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}

.animate-wave {
  animation-name: wave-animation;
  /* Refers to the name of your @keyframes element below */
  animation-duration: 2.5s;
  /* Change to speed up or slow down */
  transform-origin: 70% 70%;
  /* Pivot around the bottom-left palm */
  display: inline-block;
}

@keyframes wave-animation {
  0% {
    transform: rotate(0.0deg)
  }

  10% {
    transform: rotate(14.0deg)
  }

  /* The following five values can be played with to make the waving more or less extreme */
  20% {
    transform: rotate(-8.0deg)
  }

  30% {
    transform: rotate(14.0deg)
  }

  40% {
    transform: rotate(-4.0deg)
  }

  50% {
    transform: rotate(10.0deg)
  }

  60% {
    transform: rotate(0.0deg)
  }

  /* Reset for the last half to pause */
  100% {
    transform: rotate(0.0deg)
  }
}
</style>
