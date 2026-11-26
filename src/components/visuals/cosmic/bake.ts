import { useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

const QUAD_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

/**
 * Render a fragment shader once into an offscreen texture.
 * Used to bake static procedural content (nebula, planet surfaces) so it is
 * computed a single time instead of every frame — zero visual change.
 */
export function useBakeTexture(
  fragmentShader: string,
  uniforms: Record<string, THREE.IUniform>,
  width: number,
  height: number,
): THREE.Texture | null {
  const { gl } = useThree()
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    const rt = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
      depthBuffer: false,
      stencilBuffer: false,
    })
    rt.texture.colorSpace = THREE.NoColorSpace

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: QUAD_VERTEX,
      fragmentShader,
      depthTest: false,
      depthWrite: false,
    })
    const geo = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geo, mat)
    const scene = new THREE.Scene()
    scene.add(mesh)
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const prev = gl.getRenderTarget()
    gl.setRenderTarget(rt)
    gl.render(scene, cam)
    gl.setRenderTarget(prev)

    geo.dispose()
    mat.dispose()
    setTexture(rt.texture)

    return () => {
      rt.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, width, height])

  return texture
}
