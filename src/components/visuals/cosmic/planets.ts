import * as THREE from 'three'

export interface PlanetSpec {
  name: string
  radius: number
  /** 0 rocky, 1 gas, 2 earth-like, 3 ice */
  type: number
  a: string
  b: string
  c: string
  atmo: string
  texture: string
  ring?: { color: string; texture: string }
}

export const SUN_DIR = new THREE.Vector3(-0.8, 0.5, 0.35).normalize()

export const PLANETS: PlanetSpec[] = [
  {
    name: '水星',
    radius: 0.55,
    type: 0,
    a: '#cdc7bb',
    b: '#6f6a61',
    c: '#3b3731',
    atmo: '#9a948a',
    texture: '/textures/2k_mercury.jpg',
  },
  {
    name: '金星',
    radius: 0.72,
    type: 1,
    a: '#f7e2a6',
    b: '#c79a55',
    c: '#f3cf86',
    atmo: '#f7e2a6',
    texture: '/textures/2k_venus_atmosphere.jpg',
  },
  {
    name: '地球',
    radius: 0.82,
    type: 2,
    a: '#3f7d3a',
    b: '#123f7a',
    c: '#eaf6ff',
    atmo: '#5aa8ff',
    texture: '/textures/earth_day.jpg',
  },
  {
    name: '火星',
    radius: 0.62,
    type: 0,
    a: '#d97b4a',
    b: '#7a3a22',
    c: '#3a1a10',
    atmo: '#e08a5a',
    texture: '/textures/2k_mars.jpg',
  },
  {
    name: '木星',
    radius: 1.72,
    type: 1,
    a: '#ead2a4',
    b: '#a9784a',
    c: '#e0b27a',
    atmo: '#ead2a4',
    texture: '/textures/2k_jupiter.jpg',
  },
  {
    name: '土星',
    radius: 1.46,
    type: 1,
    a: '#e8d9a8',
    b: '#b8a06a',
    c: '#d9c080',
    atmo: '#e8d9a8',
    texture: '/textures/2k_saturn.jpg',
    ring: { color: '#d9c9a0', texture: '/textures/2k_saturn_ring_alpha.png' },
  },
  {
    name: '天王星',
    radius: 1.0,
    type: 3,
    a: '#b8f0ee',
    b: '#4fa8b0',
    c: '#d0f6f4',
    atmo: '#8fe0e6',
    texture: '/textures/2k_uranus.jpg',
  },
]
