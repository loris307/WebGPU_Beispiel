// main.js
async function initWebGPU() {
	// 1. Überprüfen, ob WebGPU verfügbar ist
	if (!('gpu' in navigator)) {
	  console.error('WebGPU wird nicht unterstützt.');
	  return;
	}
  
	// 2. Adapter und Device anfordern
	const adapter = await navigator.gpu.requestAdapter();
	if (!adapter) {
	  console.error('Kein WebGPU-Adapter gefunden.');
	  return;
	}
	const device = await adapter.requestDevice();
  
	// 3. Canvas-Kontext holen
	const canvas = document.getElementById('gpuCanvas');
	const context = canvas.getContext('webgpu');
  
	// 4. Format & Canvas-Konfiguration
	const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
	context.configure({
	  device,
	  format: presentationFormat,
	});
  
	// 5. Shader-Code in WGSL
	const shaderCode = `
	  @vertex
	  fn main_vertex(@builtin(vertex_index) vertexIndex : u32)
		  -> @builtin(position) vec4<f32> {
  
		  // Ein einfaches Dreieck: vertexIndex 0, 1, 2
		  var positions = array<vec2<f32>, 3>(
			  vec2<f32>(0.0, 0.5),   // oben
			  vec2<f32>(-0.5, -0.5), // links unten
			  vec2<f32>(0.5, -0.5)   // rechts unten
		  );
		  return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
	  }
  
	  @fragment
	  fn main_fragment() -> @location(0) vec4<f32> {
		  // Gibt jedem Pixel des Dreiecks eine rote Farbe zurück
		  return vec4<f32>(1.0, 0.0, 1.0, 1.0);
	  }
	`;
  
	// 6. GPUShaderModule erstellen
	const shaderModule = device.createShaderModule({
	  code: shaderCode
	});
  
	// 7. Render-Pipeline anlegen
	const pipeline = device.createRenderPipeline({
	  layout: 'auto',
	  vertex: {
		module: shaderModule,
	  },
	  fragment: {
		module: shaderModule,
		targets: [
		  {
			format: presentationFormat
		  }
		]
	  }
	});
  
	// 8. Renderpass & Befehlskette (Command Encoder) einrichten
	function drawFrame() {
	  // a) View (Framebuffer) vom Canvas holen
	  const currentTexture = context.getCurrentTexture();
	  const view = currentTexture.createView();
  
	  // b) Renderpass-Deskriptor
	  const renderPassDescriptor = {
		colorAttachments: [
		  {
			view,
			clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 }, // Hintergrundfarbe
			loadOp: 'clear',
			storeOp: 'store'
		  }
		]
	  };
  
	  // c) Command Encoder erstellen
	  const commandEncoder = device.createCommandEncoder();
	  const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
  
	  // d) Pipeline binden und zeichnen
	  passEncoder.setPipeline(pipeline);
	  passEncoder.draw(3); // 3 Eckpunkte -> ein Dreieck
	  passEncoder.end();
  
	  // e) Befehle an die GPU übergeben
	  const commands = commandEncoder.finish();
	  device.queue.submit([commands]);
	}

	drawFrame()

  }
  
  // Initialisieren, sobald die Seite geladen ist
  window.addEventListener('DOMContentLoaded', initWebGPU);
  