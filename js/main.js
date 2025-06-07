// Constantes y variables globales
const RATE_PER_SECOND = 0.50; // Tarifa por segundo en $
const NODES_COUNT = 6;
const ANIMATION_SPEED_FACTOR = 1; // Factor para ajustar la velocidad de animación (1 = tiempo real)

// Estructura para almacenar el grafo
class GraphSimple {
    constructor() {
        this.nodes = NODES_COUNT;
        this.adjacencyList = Array(this.nodes).fill().map(() => []);
    }

    // Añadir arista bidireccional
    addEdge(u, v, weight) {
        this.adjacencyList[u].push({ node: v, weight });
        this.adjacencyList[v].push({ node: u, weight });
    }

    // Algoritmo de Dijkstra para encontrar la ruta más corta
    dijkstraSimple(source) {
        const distances = Array(this.nodes).fill(Infinity);
        const previous = Array(this.nodes).fill(null);
        const visited = Array(this.nodes).fill(false);
        
        distances[source] = 0;
        
        for (let i = 0; i < this.nodes; i++) {
            // Encontrar el nodo no visitado con la distancia mínima
            let minDistance = Infinity;
            let minIndex = -1;
            
            for (let j = 0; j < this.nodes; j++) {
                if (!visited[j] && distances[j] < minDistance) {
                    minDistance = distances[j];
                    minIndex = j;
                }
            }
            
            if (minIndex === -1) break;
            
            visited[minIndex] = true;
            
            // Actualizar distancias a los nodos adyacentes
            for (const neighbor of this.adjacencyList[minIndex]) {
                const alt = distances[minIndex] + neighbor.weight;
                if (alt < distances[neighbor.node]) {
                    distances[neighbor.node] = alt;
                    previous[neighbor.node] = minIndex;
                }
            }
        }
        
        return { distances, previous };
    }
    
    // Reconstruir la ruta desde el origen al destino
    getPath(previous, destination) {
        const path = [];
        let current = destination;
        
        while (current !== null) {
            path.unshift(current);
            current = previous[current];
        }
        
        return path;
    }
}

// Gestión de usuarios (simulado con localStorage)
const userManager = {
    // Registrar un nuevo usuario
    register(name, email, password) {
        // Verificar si el usuario ya existe
        const users = this.getUsers();
        if (users.find(user => user.email === email)) {
            return { success: false, message: 'El correo ya está registrado' };
        }
        
        // Añadir nuevo usuario
        users.push({ name, email, password });
        localStorage.setItem('users', JSON.stringify(users));
        
        // Simular escritura en users.txt (solo para mostrar)
        console.log(`Usuario registrado: ${name}, ${email}, ${password}`);
        
        return { success: true, message: 'Usuario registrado correctamente' };
    },
    
    // Iniciar sesión
    login(email, password) {
        const users = this.getUsers();
        const user = users.find(user => user.email === email && user.password === password);
        
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, user };
        } else {
            return { success: false, message: 'Correo o contraseña incorrectos' };
        }
    },
    
    // Cerrar sesión
    logout() {
        localStorage.removeItem('currentUser');
    },
    
    // Obtener usuario actual
    getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    },
    
    // Obtener todos los usuarios
    getUsers() {
        const usersStr = localStorage.getItem('users');
        return usersStr ? JSON.parse(usersStr) : [];
    }
};

// Gestión del grafo y visualización
const graphManager = {
    graph: null,
    nodeElements: [],
    edgeElements: [],
    nodePositions: [],
    edges: [],
    selectedOrigin: null,
    selectedDestination: null,
    canvas: null,
    ctx: null,
    animationInProgress: false,
    
    // Inicializar el grafo
    init() {
        this.graph = new GraphSimple();
        
        // Definir las aristas del grafo [origen, destino, peso en segundos]
        this.edges = [
            [0, 1, 10], // Nodo 1 a Nodo 2: 10 segundos
            [0, 2, 15], // Nodo 1 a Nodo 3: 15 segundos
            [1, 2, 12], // Nodo 2 a Nodo 3: 12 segundos
            [1, 3, 8],  // Nodo 2 a Nodo 4: 8 segundos
            [2, 4, 10], // Nodo 3 a Nodo 5: 10 segundos
            [3, 4, 14], // Nodo 4 a Nodo 5: 14 segundos
            [3, 5, 20], // Nodo 4 a Nodo 6: 20 segundos
            [4, 5, 9],  // Nodo 5 a Nodo 6: 9 segundos
            [2, 5, 25]  // Nodo 3 a Nodo 6: 25 segundos
        ];
        
        // Añadir aristas al grafo
        for (const [u, v, w] of this.edges) {
            this.graph.addEdge(u, v, w);
        }
        
        // Configurar el canvas
        this.canvas = document.getElementById('graph-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        
        // Calcular posiciones de los nodos
        this.calculateNodePositions();
        
        // Dibujar el grafo
        this.drawGraph();
        
        // Añadir event listener para redimensionar
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.calculateNodePositions();
            this.drawGraph();
        });
    },
    
    // Ajustar tamaño del canvas
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    },
    
    // Calcular posiciones de los nodos en el canvas
    calculateNodePositions() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const padding = 50;
        
        // Posiciones predefinidas para los 6 nodos
        this.nodePositions = [
            { x: padding + 50, y: height / 2 },                      // Nodo 1 (izquierda)
            { x: width / 3, y: padding + 50 },                       // Nodo 2 (arriba izquierda)
            { x: width / 3, y: height - padding - 50 },              // Nodo 3 (abajo izquierda)
            { x: 2 * width / 3, y: padding + 50 },                   // Nodo 4 (arriba derecha)
            { x: 2 * width / 3, y: height - padding - 50 },          // Nodo 5 (abajo derecha)
            { x: width - padding - 50, y: height / 2 }               // Nodo 6 (derecha)
        ];
    },
    
    // Dibujar el grafo completo
    drawGraph() {
        // Limpiar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar aristas
        for (const [u, v, weight] of this.edges) {
            this.drawEdge(u, v, weight);
        }
        
        // Dibujar nodos
        for (let i = 0; i < NODES_COUNT; i++) {
            this.drawNode(i);
        }
    },
    
    // Dibujar un nodo
    drawNode(index) {
        const { x, y } = this.nodePositions[index];
        const radius = 20;
        
        // Determinar el color del nodo
        let color = '#3498db'; // Color por defecto
        if (index === this.selectedOrigin) {
            color = '#2ecc71'; // Verde para origen
        } else if (index === this.selectedDestination) {
            color = '#e74c3c'; // Rojo para destino
        }
        
        // Dibujar círculo
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        // Dibujar borde
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.stroke();
        
        // Dibujar número del nodo
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText((index + 1).toString(), x, y);
        
        // Añadir evento de clic al nodo
        this.canvas.onclick = (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;
            
            // Verificar si se hizo clic en algún nodo
            for (let i = 0; i < NODES_COUNT; i++) {
                const nodeX = this.nodePositions[i].x;
                const nodeY = this.nodePositions[i].y;
                const distance = Math.sqrt((clickX - nodeX) ** 2 + (clickY - nodeY) ** 2);
                
                if (distance <= radius) {
                    this.handleNodeClick(i);
                    break;
                }
            }
        };
    },
    
    // Dibujar una arista
    drawEdge(u, v, weight) {
        const start = this.nodePositions[u];
        const end = this.nodePositions[v];
        
        // Dibujar línea
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#bdc3c7';
        this.ctx.stroke();
        
        // Dibujar peso
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#555';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Fondo para el texto
        const textWidth = this.ctx.measureText(weight + 's').width;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(midX - textWidth / 2 - 4, midY - 10, textWidth + 8, 20);
        
        // Texto del peso
        this.ctx.fillStyle = '#555';
        this.ctx.fillText(weight + 's', midX, midY);
    },
    
    // Manejar clic en un nodo
    handleNodeClick(index) {
        if (!this.animationInProgress) {
            if (this.selectedOrigin === null) {
                this.selectedOrigin = index;
                document.getElementById('origin-select').value = index;
            } else if (this.selectedDestination === null && index !== this.selectedOrigin) {
                this.selectedDestination = index;
                document.getElementById('destination-select').value = index;
            } else {
                this.selectedOrigin = index;
                this.selectedDestination = null;
                document.getElementById('origin-select').value = index;
                document.getElementById('destination-select').value = '';
            }
            this.drawGraph();
        }
    },
    
    // Seleccionar origen desde el dropdown
    selectOrigin(index) {
        if (!this.animationInProgress) {
            this.selectedOrigin = parseInt(index);
            if (this.selectedDestination === this.selectedOrigin) {
                this.selectedDestination = null;
                document.getElementById('destination-select').value = '';
            }
            this.drawGraph();
        }
    },
    
    // Seleccionar destino desde el dropdown
    selectDestination(index) {
        if (!this.animationInProgress) {
            this.selectedDestination = parseInt(index);
            if (this.selectedOrigin === this.selectedDestination) {
                this.selectedOrigin = null;
                document.getElementById('origin-select').value = '';
            }
            this.drawGraph();
        }
    },
