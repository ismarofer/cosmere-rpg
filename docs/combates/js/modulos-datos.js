/* Generado por tools/modulos_adversario.py desde la Guía del Mundo de Mistborn (cap. 8, módulos de adversario). No editar a mano. */
window.CB_MODULOS = [
 {
  "id": "alomancia:acero",
  "familia": "alomancia",
  "metal": "acero",
  "nombre": "Alomancia de acero",
  "era": null,
  "rangoMin": null,
  "desc": "Los brumosos de acero, llamados lanzamonedas, pueden detectar y empujar con acero fuentes de metal cercanas. La mayoría llevan monedas (o, en la Era 2, casquillos de bala) que pueden lanzar contra sus enemigos o usar para impulsarse desde el suelo.",
  "reglas": "",
  "rasgos": [],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Lanzar moneda",
    "texto": "Ataque + el modificador de Alomancia del lanzamonedas, alcance 6 m por cada punto de Investidura gastado, el daño por golpe equivale al dado de artes metálicas del lanzamonedas + su modificador de Alomancia.",
    "glifo": "1",
    "cab": "Coste: 1 + Investidura, Máx. 1 + Rango"
   },
   {
    "tipo": "accion",
    "n": "Quemar acero",
    "texto": "Hasta el final de la escena, el lanzamonedas siente todas las fuentes de metal no Investido y que no sea aluminio dentro de su alcance de artes metálicas.",
    "glifo": "1"
   },
   {
    "tipo": "accion",
    "n": "Empujón de acero",
    "texto": "El lanzamonedas elige un objeto metálico que sienta con Quemar acero y mueve el objeto o a sí mismo en línea recta alejándose del otro, hasta 6 metros por cada punto de Investidura gastado. Los objetos de menor tamaño se desplazan alejándose del lanzamonedas, mientras que el lanzamonedas se desplaza alejándose de objetos de su mismo tamaño o mayores; si el objeto está unido a otra cosa, eso cuenta para determinar su tamaño. Esta capacidad puede usarse de forma creativa (por ejemplo, para desarmar enemigos o para permitir que el lanzamonedas “vuele” distancias cortas). Para afectar de este modo a un personaje reticente, el lanzamonedas debe superar una prueba de Alomancia contra la Defensa física del objetivo.",
    "glifo": "1",
    "cab": "Coste: 1 + Investidura, Máx. 1 + Rango"
   }
  ],
  "perfiles": "Los adversarios que prefieren combatir a distancia son excelentes lanzamonedas, como el planificador o el rebelde. Además, adversarios como guardaespaldas y matones pueden usar Empujón de acero para lanzarse al combate."
 },
 {
  "id": "alomancia:atium",
  "familia": "alomancia",
  "metal": "atium",
  "nombre": "Alomancia de atium",
  "era": 1,
  "rangoMin": null,
  "desc": "Los brumosos de atium, conocidos como videntes, pueden ver “sombras de atium” de futuros posibles, lo que les permite reaccionar de forma casi premonitoria a su entorno. La existencia de estos brumosos no era conocida fuera del Ministerio de Acero hasta casi el final de la Era 1.",
  "reglas": "Añadir este módulo puede provocar un gran desequilibrio, por lo que las reglas habituales sobre la amenaza de módulos no siempre se aplican; úsalo con responsabilidad. Para una experiencia de juego más consistente, se recomienda utilizar el conjunto de características de nacido de la bruma o de Inquisidor de Acero, ambos capaces de quemar atium.",
  "rasgos": [],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Quemar atium",
    "texto": "Durante un número de rondas igual a sus grados en Alomancia, cuando el vidente haga una prueba para interactuar físicamente con otro personaje (incluidas las pruebas contra la Defensa física), no tires ningún d20. En su lugar, todos los d20, ventajas y desventajas incluidas, cuentan como un resultado de 15. Del mismo modo, cuando un enemigo haga una prueba para interactuar físicamente con el vidente (incluidas las pruebas contra la Defensa física), el valor de sus d20 pasa a ser 5. Antes de que este efecto termine, el vidente puede mantenerlo gastando 1 uso de Quemar atium como 0.",
    "glifo": "2",
    "cab": "1 uso por perla de atium"
   }
  ]
 },
 {
  "id": "alomancia:bendaleo",
  "familia": "alomancia",
  "metal": "bendaleo",
  "nombre": "Alomancia de bendaleo",
  "era": 2,
  "rangoMin": null,
  "desc": "Los brumosos de bendaleo, llamados deslizadores, pueden crear una burbuja de tiempo acelerado.",
  "reglas": "",
  "rasgos": [],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Quemar bendaleo",
    "texto": "El deslizador crea una burbuja temporal en una zona Enorme (4,5 metros) centrada en su posición actual. Esta burbuja tiene los siguientes efectos:\n◆Cada ronda concluye con una ronda adicional, durante la cual solo pueden actuar los personajes dentro de la burbuja, cada uno con un turno. En su turno, obtienen un número de acciones igual a 1 + la Investidura gastada.\n◆En combate, esta ronda adicional tiene lugar tras el último turno lento de cada ronda. Primero actúan los PJs y después los PNJs.\n◆En una conversación o empeño, esta ronda adicional empieza tras la última contribución de la ronda. Los personajes dentro de la burbuja pueden hacer una contribución adicional por cada 2 (redondeando hacia arriba).\n◆Dentro de la burbuja, la duración de los efectos se agota más rápido. Por cada 2 (redondeando hacia arriba) concedidos por la burbuja, se considera que ha pasado una ronda para los efectos en curso.\n◆Los personajes que atraviesan voluntariamente el límite de la burbuja pierden una cantidad de concentración igual a la Investidura gastada; si esto reduce su concentración a 0 (o si ya estaban a 0), quedan Aturdidos hasta el final de su siguiente turno.\n◆Los personajes fuera de la burbuja no pueden comunicarse por medios mundanos con los que están dentro ni ejercer influencia sobre ellos, y viceversa.\n◆Cuando un personaje hace un ataque a través del límite de la burbuja, sufre un número de desventajas igual a la Investidura gastada al Quemar bendaleo. El ataque adquiere el rasgo de arma Peligrosa y no puede impactar ni causar un rasguño al objetivo salvo que el atacante también gaste O. La burbuja temporal termina al final de la ronda adicional, salvo que el deslizador la mantenga como 0 mientras permanezca dentro, gastando la misma cantidad de Investidura que antes.",
    "glifo": "2",
    "cab": "Coste: 1 + Investidura, Máx. 1 + Rango"
   }
  ],
  "perfiles": "Los adversarios preparados para combatir en duelos son deslizadores especialmente eficaces, como el matón y el oficial de sangre koloss."
 },
 {
  "id": "alomancia:bronce",
  "familia": "alomancia",
  "metal": "bronce",
  "nombre": "Alomancia de bronce",
  "era": null,
  "rangoMin": null,
  "desc": "Los brumosos de bronce, llamados buscadores, pueden detectar los pulsos alománticos, lo que les permite vigilar y rastrear a otros alomantes.",
  "reglas": "No aumentes la amenaza al aplicar este módulo.",
  "rasgos": [],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Quemar bronce",
    "texto": "Hasta el final de la escena, el buscador detecta lo siguiente dentro de su alcance de artes metálicas:\n◆Cada vez que se gasta Investidura.\n◆Cada efecto en curso alimentado por Investidura, como las acciones Quemar de los alomantes, incluso si esa Investidura se gastó antes de que el buscador usara esta acción. El buscador puede sentir la dirección general del origen de estos efectos. Mientras pueda detectarlos, también puede decidir rastrear la ubicación exacta y la fuente de un número de efectos igual a la Investidura gastada. El buscador puede hacer una prueba de Alomancia CD 15 como 1 para determinar qué poder ha generado uno de los efectos que está rastreando.",
    "glifo": "1",
    "cab": "Coste: 1 + Investidura, Máx. 1 + Rango"
   }
  ],
  "perfiles": "Los adversarios como el alguacil, el detective, el obligador y el vigilante de la ley pueden cazar e identificar mejor a sus objetivos con este módulo."
 },
 {
  "id": "alomancia:cadmio",
  "familia": "alomancia",
  "metal": "cadmio",
  "nombre": "Alomancia de cadmio",
  "era": 2,
  "rangoMin": null,
  "desc": "Los brumosos de cadmio, llamados pulsadores, pueden crear una burbuja de tiempo ralentizado.",
  "reglas": "",
  "rasgos": [],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Quemar cadmio",
    "texto": "El pulsador crea una burbuja de tiempo en una zona Enorme (4,5 metros) centrada en su posición actual. El tiempo dentro de esta burbuja se ralentiza drásticamente. Los personajes dentro de la burbuja obtienen una cantidad de puntos de demora igual a 1 + la Investidura gastada. Mientras un personaje tenga al menos 1 punto de demora, debe usar todas sus acciones y contribuciones disponibles para eliminar esos puntos de una de las siguientes formas, y no puede usar otras acciones ni reacciones hasta hacerlo:\n◆Como 1, puede eliminar 1 punto de demora propio. Un personaje puede usar esta acción más de una vez por turno.\n◆Puede usar una acción gratuita. Si dicho efecto le otorga 1 o más, estas pueden emplearse para eliminar puntos de demora.\n◆Durante una conversación o empeño, puede usar su contribución para eliminar 2 puntos de demora propios.\n◆La burbuja tiene además los siguientes efectos:\n◆La duración de los efectos transcurre más lentamente dentro de la burbuja. Mientras un personaje tenga al menos 1 punto de demora, la duración (aunque no los efectos) de los efectos persistentes queda en pausa, ignorando el transcurso de rondas y turnos.\n◆Los personajes que atraviesan voluntariamente el límite de la burbuja pierden una cantidad de concentración igual a la Investidura gastada; si esto reduce su concentración a 0 (o si ya estaban a 0), quedan Aturdidos hasta el final de su siguiente turno.\n◆Los personajes fuera de la burbuja no pueden comunicarse por medios mundanos con los que están dentro ni ejercer influencia sobre ellos, y viceversa.\n◆Cuando un personaje hace un ataque a través del límite de la burbuja, sufre un número de desventajas igual a la Investidura gastada al Quemar cadmio. El ataque adquiere el rasgo de arma Peligrosa y no puede impactar ni causar un rasguño al objetivo salvo que el atacante también gaste O. La burbuja termina al final de la ronda en la que el pulsador elimina su último punto de demora. Cuando esto sucede, elimina los puntos de demora restantes de los personajes afectados. Antes de que la burbuja termine, el pulsador puede mantenerla como 0 mientras permanezca dentro de ella, gastando la misma Investidura que antes y otorgando a los personajes en su interior una cantidad de puntos de demora adicionales igual a 1 + la Investidura gastada.",
    "glifo": "2",
    "cab": "Coste: 1 + Investidura, Máx. 1 + Rango"
   }
  ],
  "perfiles": "Los adversarios que trabajan en equipo, como los Sangre Espectral, el vigilante de la ley o el alguacil, resultan pulsadores formidables."
 },
 {
  "id": "alomancia:cinc",
  "familia": "alomancia",
  "metal": "cinc",
  "nombre": "Alomancia de cinc",
  "era": null,
  "rangoMin": null,
  "desc": "Los brumosos de cinc, llamados encendedores, pueden encender las emociones de los demás, haciendo que sean más propensos a actuar guiados por ellas.",
  "reglas": "",
  "rasgos": [],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Quemar cinc",
    "texto": "El encendedor elige una emoción y uno o más objetivos en una zona Grande (3 metros) dentro de su alcance de artes metálicas, y hace una prueba de Alomancia contra la Defensa espiritual de cada uno. Si tiene éxito, la emoción elegida es encendida en ese objetivo, influyéndolo para que actúe en consonancia con ella hasta el final de su siguiente turno. Antes de que este efecto termine, el encendedor puede mantenerlo sobre todos los objetivos afectados en esa zona gastando 1 punto o más de Investidura como 0. Un objetivo afectado puede resistirse como 0, gastando una cantidad de concentración igual a la Investidura gastada al Quemar cinc (en lugar del coste habitual para resistirse a la influencia). Tras hacerlo, ignora sus emociones alteradas hasta el inicio de su siguiente turno. Capítulo 8: Adversarios",
    "glifo": "1",
    "cab": "Coste: 1 + Investidura, Máx. 1 + Rango"
   }
  ],
  "perfiles": "Los adversarios que se basan en control de multitudes, como el estafador, el detective, el mercader y el aristócrata, pueden sacar buen partido de este módulo."
 },
 {
  "id": "alomancia:cobre",
  "familia": "alomancia",
  "metal": "cobre",
  "nombre": "Alomancia de cobre",
  "era": null,
  "rangoMin": null,
  "desc": "Los brumosos de cobre, llamados ahumadores o nubes de cobre, generan nubes de cobre que ocultan la Investidura en su interior.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Emocionalmente inerte",
    "texto": "Los personajes dentro de la nube de cobre del ahumador son inmunes a los efectos Investidos que afecten a su mente o a sus emociones, salvo que dichos efectos cuesten al menos 6 puntos de Investidura (o un recurso similar, como cargas de mente de metal).",
    "rangoMin": 3
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Quemar cobre",
    "texto": "El ahumador crea una nube de cobre centrada en sí mismo, que cubre una zona de hasta 3 metros de radio. La nube de cobre tiene los siguientes efectos:\n◆Los poderes y sentidos Investidos no pueden detectar la nube de cobre. Además, no pueden detectar a los personajes ni el uso de Investidura a través de ella.\n◆La mente y las emociones del ahumador no pueden verse afectadas por efectos Investidos.\n◆Los dos efectos anteriores se ignoran frente a efectos Investidos que cuesten al menos 6 puntos de Investidura.\n◆La nube de cobre se mueve con el ahumador y permanece hasta el final de la escena o hasta que la disipe en un turno posterior como 0.",
    "glifo": "1",
    "cab": "Coste: 1 punto de Investidura"
   }
  ],
  "perfiles": "Los adversarios que se basan en la sutileza, como el detective o el aristócrata, pueden usar este módulo para ocultar su propia alomancia y la de sus aliados."
 },
 {
  "id": "alomancia:cromo",
  "familia": "alomancia",
  "metal": "cromo",
  "nombre": "Alomancia de cromo",
  "era": 2,
  "rangoMin": null,
  "desc": "Los brumosos de cromo, llamados sanguijuelas, absorben la Investidura de sus oponentes.",
  "reglas": "",
  "rasgos": [],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Quemar cromo",
    "texto": "La sanguijuela elige un personaje u objeto Investido en su cercanía. El efecto de esta acción depende del tipo de objetivo: Objeto o personaje infundido. El objetivo (o el efecto infuso en él) pierde una cantidad de Investidura igual al dado de artes metálicas de la sanguijuela. Objeto con cargas. Un objeto con cargas pierde cargas igual a la mitad del dado de artes metálicas de la sanguijuela. En el caso de una mente de metal feruquímica, un personaje con 0 de Investidura debe estar almacenando o decantando con ella. Para afectar a un personaje reticente, o a un objeto que alguien lleve puesto o sostenga, la sanguijuela debe superar primero una prueba de Alomancia contra la Defensa física del objetivo. Si falla, el objetivo no resulta afectado y la sanguijuela no gasta Investidura.",
    "glifo": "1",
    "cab": "Coste: 1 punto de Investidura"
   }
  ],
  "perfiles": "Este módulo resulta especialmente útil para adversarios que prevén entrar en combate contra alomantes junto a un equipo, como el agente del Grupo."
 },
 {
  "id": "alomancia:duraluminio",
  "familia": "alomancia",
  "metal": "duraluminio",
  "nombre": "Alomancia de duraluminio",
  "era": null,
  "rangoMin": null,
  "desc": "Los alomantes de duraluminio pueden intensificar sus otras capacidades Investidas, consumiendo todas sus reservas en un solo estallido. Los brumosos de duraluminio se conocen como mosquitos de duraluminio, ya que este poder es inútil si no se dispone de acceso a otro. Las propiedades alománticas del duraluminio no se conocieron hasta casi el final de la Era 1.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Estallido de duraluminio",
    "texto": "Antes de que el alomante use o mantenga una capacidad que gaste Investidura, puede potenciarla (no requiere acción) gastando toda la Investidura que le quede en esta capacidad, ignorando los límites o costes habituales. Este estallido tiene los siguientes efectos:\n◆Los efectos de la capacidad aumentan en función de la Investidura adicional gastada (incluso si normalmente no escalan), y el alomante debe elegir siempre el tamaño, alcance y número de objetivos máximos posibles.\n◆El alomante tira el dado de trama. Si saca O, puede gastarlo como de costumbre. Si saca C, pierde el control. Las consecuencias dependen de la capacidad que lo haya provocado, pero pueden incluir daños al entorno, pérdida de concentración o incluso daño o lesiones para el propio alomante, sus aliados o transeúntes."
   }
  ],
  "acciones": [],
  "perfiles": "Este módulo puede aportar un poco más de pegada a adversarios que ya dispongan de otros módulos de alomancia."
 },
 {
  "id": "alomancia:electro",
  "familia": "alomancia",
  "metal": "electro",
  "nombre": "Alomancia de electro",
  "era": null,
  "rangoMin": null,
  "desc": "Los brumosos de electro, llamados oráculos, pueden ver “sombras de electro” de sí mismos que representan posibles futuros inmediatos. Las propiedades alománticas del electro no se conocieron hasta casi el final de la Era 1.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Reacciones prescientes",
    "texto": "Cuando el oráculo usa la reacción Esquivar o Acometida reactiva, en lugar de gastar r, puede gastar una sombra de electro (no requiere acción) para usar esa reacción. Puede hacerlo incluso si ya no le quedan reacciones disponibles en esa ronda."
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Quemar electro",
    "texto": "El oráculo tira un número de d20 igual a la Investidura gastada y anota cada resultado. Estos resultados representan sombras de electro, que permanecen hasta el final de su siguiente turno. Durante ese tiempo, cuando un enemigo hace una prueba contra el oráculo, este puede gastar una de sus sombras de electro (no requiere acción) para sustituir el resultado del d20 de la prueba por el valor anotado de la sombra. Puede sustituir ese valor después de tirar los dados y aplicar ventajas o desventajas, pero debe hacerlo antes de resolver los efectos de la prueba.",
    "glifo": "1",
    "cab": "Coste: 1 + Investidura, Máx. 1 + Rango"
   }
  ],
  "perfiles": "Este módulo beneficia a adversarios audaces que prosperan convirtiendo el riesgo en recompensa, como el planificador, el obligado o el jefe de forajidos."
 },
 {
  "id": "alomancia:estano",
  "familia": "alomancia",
  "metal": "estano",
  "nombre": "Alomancia de estaño",
  "era": null,
  "rangoMin": null,
  "desc": "Los brumosos de estaño, llamados ojos de estaño, pueden aumentar la sensibilidad de todos sus sentidos.",
  "reglas": "",
  "rasgos": [],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Quemar estaño",
    "texto": "El ojo de estaño agudiza sus sentidos y experimenta los siguientes efectos hasta el final de la escena o hasta que les ponga fin en un turno posterior como 0:\n◆Pasa a estar Mejorado [Discernimiento]. La bonificación a este atributo es igual a la mitad de la Investidura gastada al Quemar estaño (redondeando hacia arriba).\n◆Todos sus sentidos se vuelven sobrenaturales. La primera vez en cada ronda que experimente una sobrecarga sensorial, debe superar una prueba de Disciplina (CD 12 + el valor de su estado Mejorado [Discernimiento]) o queda Desorientado hasta el final de su siguiente turno.\n◆Cuando el ojo de estaño usa con éxito Obtener ventaja con Deducción o con una habilidad de Discernimiento, su siguiente ataque contra ese objetivo inflige una cantidad de daño adicional equivalente a su dado de artes metálicas. Capítulo 8: Adversarios",
    "glifo": "1",
    "cab": "Coste: 1 + Investidura, Máx. 1 + Rango"
   }
  ],
  "perfiles": "Los adversarios estratégicos que buscan ventajas, como detectives, estafadores, obligadores y aristócratas, pueden sacar buen partido de este módulo."
 },
 {
  "id": "alomancia:hierro",
  "familia": "alomancia",
  "metal": "hierro",
  "nombre": "Alomancia de hierro",
  "era": null,
  "rangoMin": null,
  "desc": "Los brumosos de hierro, llamados atraedores, pueden detectar y tirar con hierro de fuentes de metal cercanas. Muchos llevan escudos de madera que pueden usar para Prevenirse.",
  "reglas": "",
  "rasgos": [],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Quemar hierro",
    "texto": "Hasta el final de la escena, el atraedor siente todas las fuentes de metal no Investido y que no sea aluminio dentro de su alcance de artes metálicas.",
    "glifo": "1"
   },
   {
    "tipo": "accion",
    "n": "Tirón de hierro",
    "texto": "El atraedor elige un objeto metálico que sienta con Quemar hierro y mueve el objeto o a sí mismo en línea recta hacia el otro, hasta 6 metros por cada punto de Investidura gastado. Los objetos de menor tamaño se desplazan hacia el atraedor, mientras que el atraedor se desplaza hacia objetos de su mismo tamaño o mayores; si el objeto está unido a otra cosa, eso cuenta para determinar su tamaño. Esta capacidad puede usarse de forma creativa (por ejemplo, para desarmar enemigos o golpear a uno que se encuentre en la trayectoria del objeto). Para afectar de ese modo a un personaje reticente, el atraedor debe superar una prueba de Alomancia contra la Defensa física del objetivo; si el efecto inflige daño, debe hacer un ataque de Alomancia, infligiendo tanto daño como su dado de artes metálicas + su modificador de Alomancia.",
    "glifo": "1",
    "cab": "Coste: 1 + Investidura, Máx. 1 + Rango"
   },
   {
    "tipo": "accion",
    "n": "Tirón de proyectil",
    "texto": "Antes de que un aliado dentro del alcance de artes metálicas del atraedor sea atacado con un proyectil metálico que el atraedor sienta con Quemar hierro, el atraedor pasa a ser el objetivo del ataque en su lugar.",
    "glifo": "r",
    "cab": "Coste: 1 punto de Investidura"
   }
  ],
  "perfiles": "Los adversarios duros que buscan llamar la atención suelen ser los mejores atraedores, como guardaespaldas, matones u oficiales de sangre koloss."
 },
 {
  "id": "alomancia:laton",
  "familia": "alomancia",
  "metal": "laton",
  "nombre": "Alomancia de latón",
  "era": null,
  "rangoMin": null,
  "desc": "Los brumosos de latón, llamados aplacadores, pueden amortiguar las emociones de los demás, haciendo que sean menos propensos a actuar guiados por ellas.",
  "reglas": "",
  "rasgos": [],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Quemar latón",
    "texto": "El aplacador elige una emoción y uno o más objetivos en una zona Grande (3 metros) dentro de su alcance de artes metálicas, y hace una prueba de Alomancia contra la Defensa espiritual de cada uno. Si tiene éxito, la emoción elegida es aplacada en ese objetivo, influyéndolo para que actúe en consonancia con ella hasta el final de su siguiente turno. Antes de que este efecto termine, el aplacador puede mantenerlo sobre todos los objetivos afectados en esa zona gastando 1 punto o más de Investidura como 0. Un objetivo afectado puede resistirse como 0, gastando una cantidad de concentración igual a la Investidura gastada al Quemar latón (en lugar del coste habitual para resistirse a la influencia). Tras hacerlo, ignora sus emociones alteradas hasta el inicio de su siguiente turno.",
    "glifo": "2",
    "cab": "Coste: 1 + Investidura, Máx. 1 + Rango"
   }
  ],
  "perfiles": "Los adversarios que se basan en la manipulación, como el estafador, el detective, el mercader y el aristócrata, pueden sacar gran partido de este módulo."
 },
 {
  "id": "alomancia:nicrosil",
  "familia": "alomancia",
  "metal": "nicrosil",
  "nombre": "Alomancia de nicrosil",
  "era": 2,
  "rangoMin": null,
  "desc": "Los brumosos de nicrosil, llamados nicroestallantes, pueden avivar las capacidades activas de otro personaje, consumiendo todas las reservas de dicho personaje en un único estallido.",
  "reglas": "",
  "rasgos": [],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Quemar nicrosil",
    "texto": "Antes de que otro personaje en la cercanía del nicroestallante use o mantenga una capacidad Investida, el nicroestallante provoca un estallido en esa capacidad con los siguientes efectos:\n◆Ese personaje debe gastar toda su Investidura restante (u otro recurso Investido) en la capacidad, ignorando los límites o costes habituales.\n◆Los efectos de la capacidad aumentan en función de la Investidura adicional gastada (incluso si normalmente no escalan), y el personaje debe elegir siempre el tamaño, alcance y número de objetivos máximos posibles.\n◆El personaje tira el dado de trama. Si saca O, puede gastarlo como de costumbre. Si saca C, pierde el control. Las consecuencias dependen de la capacidad que lo haya provocado, pero pueden incluir daños al entorno, pérdida de concentración o incluso daño o lesiones para el propio personaje, sus aliados o transeúntes. Para afectar a un objetivo reticente, el nicroestallante debe superar primero una prueba de Alomancia contra la Defensa física del objetivo. Si falla, no gasta Investidura en el intento.",
    "glifo": "r",
    "cab": "Coste: 1 punto de Investidura"
   }
  ],
  "perfiles": "Los adversarios que apoyan a otro alomante aprovechan mejor este módulo, como muchos vigilantes de la ley, planificadores y rebeldes."
 },
 {
  "id": "alomancia:peltre",
  "familia": "alomancia",
  "metal": "peltre",
  "nombre": "Alomancia de peltre",
  "era": null,
  "rangoMin": null,
  "desc": "Los brumosos de peltre, llamados brazos de peltre o violentos, pueden potenciar su fuerza y su resistencia.",
  "reglas": "",
  "rasgos": [],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Quemar peltre",
    "texto": "Hasta el final del siguiente turno del brazo de peltre, obtiene los siguientes beneficios:\n◆Pasa a estar Mejorado [Velocidad] y Mejorado [Fuerza]; la bonificación a estos atributos equivale a la mitad de la Investidura gastada (redondeando hacia arriba).\n◆Si está Agotado, no aplica esa penalización a los resultados de sus pruebas hasta que termine de quemar. Antes de que finalice la acción Quemar peltre, puede mantener el efecto gastando 1 o más puntos de Investidura como 0.",
    "glifo": "1",
    "cab": "Coste: 1 + Investidura, Máx. 1 + Rango"
   },
   {
    "tipo": "accion",
    "n": "Revitalizar",
    "texto": "El brazo de peltre recupera una cantidad de salud igual a 1d6 + su rango.",
    "glifo": "0",
    "cab": "Coste: 1 punto de Investidura"
   }
  ],
  "perfiles": "La alomancia de peltre beneficia enormemente a adversarios que combaten a corta distancia, como guardaespaldas, matones o forajidos."
 },
 {
  "id": "feruquimia:acero",
  "familia": "feruquimia",
  "metal": "acero",
  "nombre": "Feruquimia de acero",
  "era": null,
  "rangoMin": null,
  "desc": "Los ferrins de acero, llamados mensajeros de acero, pueden almacenar velocidad física en su menteacero.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Menteacero",
    "texto": "El mensajero de acero tiene una menteacero que almacena una cantidad de cargas igual a 3 + su rango.",
    "cab": "almacena velocidad"
   },
   {
    "tipo": "rasgo",
    "n": "Reflejos rápidos",
    "texto": "Una vez por ronda, el mensajero de acero puede gastar 1 carga de menteacero (no requiere acción) para obtener r, que solo puede usar para Esquivar o Acometida reactiva.",
    "rangoMin": 2
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Decantar velocidad",
    "texto": "El mensajero de acero obtiene los siguientes beneficios hasta el final de la escena:\n◆Pasa a estar Mejorado [Velocidad +2].\n◆Puede usar la acción Moverse como 0 una vez por turno.",
    "glifo": "1",
    "cab": "Coste: 1 carga de menteacero"
   }
  ],
  "perfiles": "Los adversarios ágiles, como un Sangre Espectral o un piloto malwish, pueden sacar buen partido a este módulo."
 },
 {
  "id": "feruquimia:aluminio",
  "familia": "feruquimia",
  "metal": "aluminio",
  "nombre": "Feruquimia de aluminio",
  "era": null,
  "rangoMin": null,
  "desc": "Los ferrins de aluminio, llamados auténticos, pueden almacenar identidad espiritual en su mentealuminio.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Mentealuminio",
    "texto": "El auténtico tiene una mentealuminio que almacena una cantidad de cargas igual a 3 + su rango.",
    "cab": "almacena identidad"
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Decantar identidad",
    "texto": "El auténtico obtiene los siguientes beneficios hasta el final de la escena:\n◆Su Defensa espiritual aumenta en 4.\n◆Resistirse a la influencia le cuesta 2 puntos de concentración menos. Capítulo 8: Adversarios",
    "glifo": "1",
    "cab": "Coste: 1 carga de mentealuminio"
   }
  ],
  "perfiles": "Adversarios como fanáticos y rebeldes pueden usar este módulo para mantenerse fieles a su causa."
 },
 {
  "id": "feruquimia:bendaleo",
  "familia": "feruquimia",
  "metal": "bendaleo",
  "nombre": "Feruquimia de bendaleo",
  "era": 2,
  "rangoMin": null,
  "desc": "Los ferrins de bendaleo, llamados incorporadores, pueden almacenar nutrición e hidratación en su mentebendaleo.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Mentebendaleo",
    "texto": "El centinela tiene una mentebendaleo que almacena una cantidad de cargas igual a 3 + su rango.",
    "cab": "almacena desvelo"
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Decantar nutrición",
    "texto": "Si el incorporador está Agotado, reduce en 2 la penalización de dicho estado. Además, la próxima vez que haga una prueba durante esta escena, puede volver a tirar un dado que haya sacado menos de 1 + su rango.",
    "glifo": "1",
    "cab": "Coste: 1 carga de mentebendaleo"
   }
  ],
  "perfiles": "Los adversarios que se basan en momentos clave para lograr la victoria, como el detective o el aristócrata, sacan mayor partido a esto con el estómago lleno."
 },
 {
  "id": "feruquimia:bronce",
  "familia": "feruquimia",
  "metal": "bronce",
  "nombre": "Feruquimia de bronce",
  "era": null,
  "rangoMin": null,
  "desc": "Los ferrins de bronce, llamados centinelas, pueden almacenar desvelo en su mentebronce.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Mentebronce",
    "texto": "El centinela tiene una mentebronce que almacena una cantidad de cargas igual a 3 + su rango.",
    "cab": "almacena desvelo"
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Alerta y despierto",
    "texto": "El centinela obtiene Mejorado [Intelecto +1] y Mejorado [Discernimiento +1] hasta el final de la escena.",
    "glifo": "1",
    "cab": "Coste: 1 carga de mentebronce"
   },
   {
    "tipo": "accion",
    "n": "Decantar desvelo",
    "texto": "El centinela tira su dado de artes metálicas y recupera esa cantidad de salud, de concentración o una combinación de ambas.",
    "glifo": "1",
    "cab": "Coste: 1 carga de mentebronce"
   }
  ],
  "perfiles": "Los adversarios que necesitan mantenerse concentrados, como el estafador o el vigilante de la ley, pueden convertirse en centinelas muy eficaces."
 },
 {
  "id": "feruquimia:cadmio",
  "familia": "feruquimia",
  "metal": "cadmio",
  "nombre": "Feruquimia de cadmio",
  "era": 2,
  "rangoMin": null,
  "desc": "Los ferrins de cadmio, llamados resollantes, pueden almacenar aliento en su mentecadmio.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Mentecadmio",
    "texto": "El resollante tiene una mentecadmio que almacena una cantidad de cargas igual a 3 + su rango.",
    "cab": "almacena aliento"
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Decantar aliento",
    "texto": "Hasta el final de la escena, el resollante no necesita respirar, y cuando usa r o 0 reduce en 1 el coste de concentración de dicha capacidad.",
    "glifo": "1",
    "cab": "Coste: 1 carga de mentecadmio"
   }
  ],
  "perfiles": "El guardaespaldas, el detective o el matón pueden aprovechar muy bien Decantar aliento para reducir el coste de sus reacciones."
 },
 {
  "id": "feruquimia:cinc",
  "familia": "feruquimia",
  "metal": "cinc",
  "nombre": "Feruquimia de cinc",
  "era": null,
  "rangoMin": null,
  "desc": "Los ferrins de cinc, llamados chispeantes, pueden almacenar velocidad mental en su mentecinc.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Mentecinc",
    "texto": "El chispeante tiene una mentecinc que almacena una cantidad de cargas igual a 3 + su rango.",
    "cab": "almacena velocidad mental"
   },
   {
    "tipo": "rasgo",
    "n": "Reflejos rápidos",
    "texto": "Una vez por ronda, el chispeante puede gastar 1 carga de mentecinc (no requiere acción) para obtener r, que solo puede usar para Esquivar o Acometida reactiva.",
    "rangoMin": 2
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Decantar velocidad mental",
    "texto": "El chispeante obtiene los siguientes efectos hasta el final de la escena:\n◆Pasa a estar Mejorado [Intelecto +2].\n◆Una vez por turno, puede usar una de las siguientes acciones como 0: Prepararse, Obtener ventaja usando su atributo de Intelecto o Usar una habilidad usando su atributo de Intelecto.",
    "glifo": "1",
    "cab": "Coste: 1 carga de mentecinc"
   }
  ],
  "perfiles": "Los adversarios que participan en duelos de ingenio y estrategia, como el detective, el planificador y el mercader, pueden sacar buen partido a este módulo."
 },
 {
  "id": "feruquimia:cobre",
  "familia": "feruquimia",
  "metal": "cobre",
  "nombre": "Feruquimia de cobre",
  "era": null,
  "rangoMin": null,
  "desc": "Los ferrins de cobre, llamados archiveros, pueden almacenar recuerdos en su mentecobre.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Mentecobre",
    "texto": "El archivero tiene una mentecobre que almacena una cantidad de cargas igual a 3 + su rango.",
    "cab": "almacena memoria"
   },
   {
    "tipo": "rasgo",
    "n": "Mentecobre indexada",
    "texto": "Antes de que el archivero haga una prueba para recordar información que haya estudiado o experimentado previamente, puede gastar 1 carga de mentecobre para tener éxito automáticamente en esa prueba (no requiere acción).",
    "cab": "Coste: 1 carga de mentecobre"
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Decantar recuerdos",
    "texto": "El archivero elige una pericia que obtiene hasta el final de la escena. Durante ese tiempo, obtiene una ventaja en las pruebas relacionadas con dicha pericia de Intelecto o Usar una habilidad usando su atributo de Intelecto.",
    "glifo": "1",
    "cab": "Coste: 1 carga de mentecobre"
   }
  ],
  "perfiles": "Los adversarios que se benefician del conocimiento especial, como el detective, el planificador o el aristócrata, se pueden beneficiar de este módulo."
 },
 {
  "id": "feruquimia:cromo",
  "familia": "feruquimia",
  "metal": "cromo",
  "nombre": "Feruquimia de cromo",
  "era": 2,
  "rangoMin": null,
  "desc": "Los ferrins de cromo, llamados hiladores, pueden almacenar Fortuna en su mentecromo. En el Cosmere, la fortuna no es suerte, sino una vaga consciencia cosmológica de las intersecciones importantes del destino.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Mentecromo",
    "texto": "El hilador tiene una mentecromo que almacena una cantidad de cargas igual a 3 + su rango.",
    "cab": "almacena Fortuna"
   },
   {
    "tipo": "rasgo",
    "n": "Lugar adecuado",
    "texto": "Al inicio de cada escena, el hilador puede gastar una cantidad de cargas de su mentecromo igual a 1 + su rango. Por cada carga gastada, se desplaza inmediatamente hasta su valor de movimiento sin activar Acometidas reactivas."
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Decantar Fortuna",
    "texto": "Los rangos de Oportunidad y de Complicación del hilador se amplían en 2 hasta el final de la escena.",
    "glifo": "1",
    "cab": "Coste: 1 carga de mentecromo"
   }
  ],
  "perfiles": "Los planificadores y los rebeldes se benefician en gran medida de estar en el lugar adecuado en el momento oportuno."
 },
 {
  "id": "feruquimia:duraluminio",
  "familia": "feruquimia",
  "metal": "duraluminio",
  "nombre": "Feruquimia de duraluminio",
  "era": null,
  "rangoMin": null,
  "desc": "Los ferrins de duraluminio, llamados conectores, pueden almacenar Conexión espiritual en su menteduraluminio.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Menteduraluminio",
    "texto": "El conector tiene una menteduraluminio que almacena una cantidad de cargas igual a 3 + su rango.",
    "cab": "almacena Conexión"
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Decantar Conexión",
    "texto": "El conector obtiene los siguientes beneficios hasta el final de la escena:\n◆Obtiene Mejorado [Presencia +2].\n◆Conoce todos los idiomas que conozcan los personajes dentro de su alcance de artes metálicas.\n◆Cuando un personaje intenta resistirse a su influencia, le cuesta 2 puntos de concentración adicionales. Capítulo 8: Adversarios",
    "glifo": "1",
    "cab": "Coste: 1 carga de menteduraluminio"
   }
  ],
  "perfiles": "Los adversarios orientados a lo social, como estafadores, mercaderes y aristócratas, pueden beneficiarse enormemente de este módulo."
 },
 {
  "id": "feruquimia:electro",
  "familia": "feruquimia",
  "metal": "electro",
  "nombre": "Feruquimia de electro",
  "era": null,
  "rangoMin": null,
  "desc": "Los ferrins de electro, llamados pináculos, pueden almacenar determinación en su mentelectro.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Mentelectro",
    "texto": "El pináculo tiene una mentelectro que almacena una cantidad de cargas igual a 3 + su rango.",
    "cab": "almacena determinación"
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Decantar determinación",
    "texto": "Hasta el final de la escena, el pináculo pasa a estar Resuelto y obtiene Mejorado [Voluntad +2]. Después de que el pináculo se resista a la influencia de otro personaje, ese personaje pierde 1 punto de concentración.",
    "glifo": "1",
    "cab": "Coste: 1 carga de mentelectro"
   },
   {
    "tipo": "accion",
    "n": "Esencia indomable",
    "texto": "Antes de que el pináculo quede reducido a 0 de salud, en su lugar pasa a estar a 1 de salud. Después, tira su dado de recuperación una vez por cada carga gastada y recupera esa cantidad de salud, de concentración o una combinación de ambas.",
    "glifo": "r",
    "cab": "Coste: todas las cargas restantes de la mentelectro",
    "rangoMin": 2
   }
  ],
  "perfiles": "Los adversarios preparados para resistir hasta el final, como los guardaespaldas y los jefes de forajidos, encajan muy bien como pináculos."
 },
 {
  "id": "feruquimia:estano",
  "familia": "feruquimia",
  "metal": "estano",
  "nombre": "Feruquimia de estaño",
  "era": null,
  "rangoMin": null,
  "desc": "Los ferrins de estaño, llamados susurravientos, pueden almacenar sentidos en su mentestaño.",
  "reglas": "",
  "rasgos": [],
  "acciones": [],
  "perfiles": "Al igual que sus equivalentes ojos de estaño, los adversarios observadores (como detectives, estafadores y aristócratas) pueden sacar buen partido a este módulo."
 },
 {
  "id": "feruquimia:hierro",
  "familia": "feruquimia",
  "metal": "hierro",
  "nombre": "Feruquimia de hierro",
  "era": null,
  "rangoMin": null,
  "desc": "Los ferrins de hierro, llamados ajustadores, pueden almacenar peso físico en su mentehierro.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Mentehierro",
    "texto": "El ajustador tiene una mentehierro que almacena una cantidad de cargas igual a 3 + su rango.",
    "cab": "almacena peso"
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Almacenar peso",
    "texto": "Hasta que el ajustador use Decantar peso o ponga fin a este efecto como 0, experimenta los siguientes efectos:\n◆Se considera de un tamaño menor para todos los efectos, salvo el espacio que ocupa y controla.\n◆No sufre daño por caídas.\n◆Los ataques cuerpo a cuerpo contra él obtienen una ventaja.\n◆Se duplica la distancia de cualquier efecto que lo desplace contra su voluntad mediante fuerza física.\n◆Rango ≥2 Obtiene una ventaja en las pruebas que no sean de ataque y usen su atributo Velocidad.",
    "glifo": "1"
   },
   {
    "tipo": "accion",
    "n": "Decantar peso",
    "texto": "Hasta que el ajustador use Almacenar peso o hasta el final de la escena, experimenta los siguientes efectos:\n◆Se le considera de un tamaño mayor para todos los efectos, excepto el espacio que ocupa y controla.\n◆Sus ataques cuerpo a cuerpo obtienen una ventaja.\n◆Antes de que un efecto lo mueva contra su voluntad, puede reducir la distancia a la que lo desplaza en cualquier cantidad.",
    "glifo": "1",
    "cab": "Coste: 1 carga de mentehierro"
   }
  ],
  "perfiles": "Los adversarios que necesitan mantenerse firmes, como los guardaespaldas y los oficiales de sangre koloss, pueden sacar el máximo partido a este módulo."
 },
 {
  "id": "feruquimia:laton",
  "familia": "feruquimia",
  "metal": "laton",
  "nombre": "Feruquimia de latón",
  "era": null,
  "rangoMin": null,
  "desc": "Los ferrins de latón, llamados almas de fuego, pueden almacenar el calor de su cuerpo en su mentelatón.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Mentelatón",
    "texto": "El alma de fuego tiene una mentelatón que almacena una cantidad de cargas igual a 3 + su rango.",
    "cab": "almacena calor"
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Almacenar calor",
    "texto": "El alma de fuego almacena calor hasta el final de la escena o hasta que use Decantar calor. Durante ese tiempo, antes de sufrir daño por energía, lo reduce en una cantidad igual a su rango.",
    "glifo": "1"
   },
   {
    "tipo": "accion",
    "n": "Decantar calor",
    "texto": "El alma de fuego decanta calor hasta el final de la escena o hasta que vuelva a Almacenar calor. Durante ese tiempo, cuando sufre daño por energía, lo aumenta en una cantidad igual a su rango. Además, al final de cada uno de sus turnos, si ha estado tocando a otro personaje durante más de unos segundos, puede usar 0 para infligirle daño por energía igual al modificador de Feruquimia del alma de fuego.",
    "glifo": "1",
    "cab": "Coste: 1 carga de mentelatón"
   },
   {
    "tipo": "accion",
    "n": "Palma abrasadora",
    "texto": "Mientras está decantando calor, el alma de fuego puede usar esta acción para Agarrar, Empujar o hacer un ataque cuerpo a cuerpo que normalmente costaría 1. Con un éxito, un impacto o un rasguño, el objetivo sufre una cantidad de daño por energía adicional igual al dado de artes metálicas del alma de fuego.",
    "glifo": "2"
   }
  ],
  "perfiles": "Los combatientes cuerpo a cuerpo, como guardaespaldas, matones y vigilantes de la ley, pueden sacar el máximo partido a este módulo."
 },
 {
  "id": "feruquimia:nicrosil",
  "familia": "feruquimia",
  "metal": "nicrosil",
  "nombre": "Feruquimia de nicrosil",
  "era": 2,
  "rangoMin": null,
  "desc": "Los ferrins de nicrosil, llamados portaalmas, pueden almacenar Investidura en su mentenicrosil.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Mentenicrosil",
    "texto": "El portaalmas tiene una mentenicrosil que almacena una cantidad de cargas igual a 3 + su rango.",
    "cab": "almacena Investidura"
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Decantar Investidura",
    "texto": "El portaalmas elige uno de sus módulos Investidos (como un módulo de alomancia o de feruquimia). Hasta el final de la escena, o hasta que vuelva a usar esta acción, se le considera de un rango superior a efectos de ese módulo.",
    "glifo": "1",
    "cab": "Coste: 1 carga de mentenicrosil"
   }
  ],
  "perfiles": "En la práctica, este poder no tiene ningún efecto si no se dispone de acceso a otro poder, pero puede aportar un plus a adversarios que utilicen alomancia o feruquimia."
 },
 {
  "id": "feruquimia:oro",
  "familia": "feruquimia",
  "metal": "oro",
  "nombre": "Feruquimia de oro",
  "era": null,
  "rangoMin": null,
  "desc": "Los ferrins de oro, llamados hacedores de sangre, pueden almacenar salud en su menteoro.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Menteoro",
    "texto": "El hacedor de sangre tiene una menteoro que almacena una cantidad de cargas igual a 3 + su rango.",
    "cab": "almacena salud"
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Decantar salud",
    "texto": "El hacedor de sangre pone fin a los efectos de una única enfermedad, droga o veneno que le afecte. Además, en ese momento y al inicio de cada uno de sus turnos hasta el final de la escena, recupera una cantidad de salud igual a su dado de artes metálicas.",
    "glifo": "1",
    "cab": "Coste: 1 carga de menteoro"
   },
   {
    "tipo": "accion",
    "n": "Sanación espontánea",
    "texto": "Antes de que la salud del hacedor de sangre se reduzca a 0 o de que sufra una lesión, puede usar Decantar salud como r. Al hacerlo, en lugar de quedarse a 0 de salud desciende a 1 de salud y/o evita sufrir la lesión, y además obtiene los efectos de Decantar salud. (Si ya estaba decantando salud, solo recupera la cantidad habitual de salud cada turno).",
    "glifo": "r"
   }
  ],
  "perfiles": "Casi todos los adversarios pueden beneficiarse de este módulo. Considera usarlo con adversarios como el planificador y el jefe de forajidos para asegurar su papel como personajes recurrentes."
 },
 {
  "id": "feruquimia:peltre",
  "familia": "feruquimia",
  "metal": "peltre",
  "nombre": "Feruquimia de peltre",
  "era": null,
  "rangoMin": null,
  "desc": "Los ferrins de peltre, llamados brutos, pueden almacenar fuerza y masa muscular en su mentepeltre.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Mentepeltre",
    "texto": "El bruto tiene una mentepeltre que almacena una cantidad de cargas igual a 3 + su rango.",
    "cab": "almacena fuerza"
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Decantar fuerza",
    "texto": "El bruto obtiene los siguientes beneficios hasta el final de la escena:\n◆Pasa a estar Mejorado [Fuerza +2].\n◆Obtiene una ventaja en las pruebas que no sean de ataque y usen su atributo Fuerza.\n◆Cuando hace un ataque con arma cuerpo a cuerpo, puede tirar su dado de artes metálicas en lugar de su dado de daño habitual. Capítulo 8: Adversarios",
    "glifo": "1",
    "cab": "Coste: 1 carga de mentepeltre"
   }
  ],
  "perfiles": "Los adversarios centrados en el combate cuerpo a cuerpo, como los guardaespaldas, los matones y los vigilantes de la ley, pueden sacar buen partido a este módulo."
 },
 {
  "id": "feruquimia:stano",
  "familia": "feruquimia",
  "metal": "stano",
  "nombre": "Feruquimia de stano",
  "era": null,
  "rangoMin": null,
  "desc": "",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Mentestaño",
    "texto": "El susurravientos tiene una mentestaño que almacena una cantidad de cargas igual a 3 + su rango.",
    "cab": "almacena sentido"
   }
  ],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Decantar sentido",
    "texto": "El susurravientos decanta un sentido. Hasta el final de la escena o hasta que use Almacenar sentido, experimenta los siguientes efectos:\n◆Pasa a estar Mejorado [Discernimiento +2].\n◆Obtiene una ventaja en las pruebas que no sean de ataque y dependan del sentido decantado.\n◆El sentido decantado se vuelve sobrenatural. La primera vez en cada ronda que reciba estímulos intensificados con ese sentido, debe superar una prueba de Disciplina CD 14 o queda Desorientado hasta el final de su siguiente turno.",
    "glifo": "1",
    "cab": "Coste: 1 carga de mentestaño"
   },
   {
    "tipo": "accion",
    "n": "Protección espontánea",
    "texto": "Antes de que el susurravientos sufra un efecto que dependa principalmente de uno de sus sentidos, pone fin a los efectos de Decantar sentido y obtiene el siguiente efecto:\n◆Amortigua temporalmente el sentido relacionado con ese efecto, obteniendo una ventaja en las pruebas para resistirse al efecto desencadenante y provocando que su origen sufra una desventaja en las pruebas relacionadas contra el susurravientos.",
    "glifo": "r"
   }
  ]
 },
 {
  "id": "feruquimia:medallon",
  "familia": "feruquimia",
  "metal": "medallon",
  "nombre": "Medallón recuperable",
  "era": null,
  "rangoMin": null,
  "desc": "",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Medallón recuperable",
    "texto": "El adversario lleva un medallón feruquímico que otorga los poderes feruquímicos del [metal, metal y metal]. Cuando el adversario es derrotado, tira un dado de trama. Con O, el medallón se puede seguir usando y un PJ lo puede llevar; en caso contrario, queda destruido."
   }
  ],
  "acciones": []
 },
 {
  "id": "clavo:acero",
  "familia": "clavo",
  "metal": "acero",
  "nombre": "Clavo de acero",
  "era": null,
  "rangoMin": 3,
  "desc": "Un clavo de acero roba un poder alomántico físico.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Clavo de acero",
    "texto": "Añade uno de los siguientes módulos de alomancia: acero, estaño, hierro o peltre. Si el adversario ya tiene ese módulo, en su lugar se le considera de un rango superior para dicho módulo."
   }
  ],
  "acciones": []
 },
 {
  "id": "clavo:bendaleo",
  "familia": "clavo",
  "metal": "bendaleo",
  "nombre": "Clavo de bendaleo",
  "era": null,
  "rangoMin": 3,
  "desc": "Un clavo de bendaleo roba un poder feruquímico espiritual.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Clavo de bendaleo",
    "texto": "Añade uno de los siguientes módulos de feruquimia: aluminio, cromo, duraluminio o nicrosil. Si el adversario ya tiene ese módulo, en su lugar se le considera de un rango superior para dicho módulo."
   }
  ],
  "acciones": []
 },
 {
  "id": "clavo:bronce",
  "familia": "clavo",
  "metal": "bronce",
  "nombre": "Clavo de bronce",
  "era": null,
  "rangoMin": 3,
  "desc": "Un clavo de bronce roba un poder alomántico cognitivo.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Clavo de bronce",
    "texto": "Añade uno de los siguientes módulos de alomancia: bronce, cobre, cinc o latón. Si el adversario ya tiene ese módulo, en su lugar se le considera de un rango superior para dicho módulo."
   }
  ],
  "acciones": []
 },
 {
  "id": "clavo:cadmio",
  "familia": "clavo",
  "metal": "cadmio",
  "nombre": "Clavo de cadmio",
  "era": null,
  "rangoMin": 3,
  "desc": "Un clavo de cadmio roba un poder alomántico temporal.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Clavo de cadmio",
    "texto": "Añade uno de los siguientes módulos de alomancia: bendaleo, cadmio o electro. Si el adversario ya tiene ese módulo, en su lugar se le considera de un rango superior para dicho módulo."
   }
  ],
  "acciones": []
 },
 {
  "id": "clavo:cinc",
  "familia": "clavo",
  "metal": "cinc",
  "nombre": "Clavo de cinc",
  "era": null,
  "rangoMin": 2,
  "desc": "Un clavo de cinc roba fortaleza emocional.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Clavo de cinc",
    "texto": "El adversario obtiene los siguientes beneficios:\n◆Su Voluntad y su Defensa cognitiva aumentan en 1 (esto también incrementa las siguientes características).\n◆Su concentración aumenta en 1.\n◆Obtiene una bonificación de +1 a las pruebas de Alomancia, Disciplina e Intimidación."
   }
  ],
  "acciones": []
 },
 {
  "id": "clavo:cobre",
  "familia": "clavo",
  "metal": "cobre",
  "nombre": "Clavo de cobre",
  "era": null,
  "rangoMin": 2,
  "desc": "Un clavo de cobre roba conocimiento e inteligencia.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Clavo de cobre",
    "texto": "El adversario obtiene los siguientes beneficios:\n◆Su atributo de Intelecto y su Defensa cognitiva aumentan en 1 (esto también incrementa las siguientes características).\n◆Obtiene una bonificación de +1 a las pruebas de Manufactura, Deducción, Saber, Medicina y Feruquimia\n◆Opcional: el adversario obtiene conocimiento específico (como un recuerdo clave o una pericia) de la víctima del clavo."
   }
  ],
  "acciones": []
 },
 {
  "id": "clavo:electro",
  "familia": "clavo",
  "metal": "electro",
  "nombre": "Clavo de electro",
  "era": null,
  "rangoMin": 3,
  "desc": "Un clavo de electro roba un poder alomántico de mejora.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Clavo de electro",
    "texto": "Añade uno de los siguientes módulos de alomancia: cromo, duraluminio o nicrosil. Si el adversario ya tiene ese módulo, en su lugar se le considera de un rango superior para dicho módulo."
   }
  ],
  "acciones": []
 },
 {
  "id": "clavo:estano",
  "familia": "clavo",
  "metal": "estano",
  "nombre": "Clavo de estaño",
  "era": null,
  "rangoMin": 2,
  "desc": "Un clavo de estaño roba un sentido (como, por ejemplo, la vista o el tacto).",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Clavo de estaño",
    "texto": "El adversario obtiene los siguientes beneficios:\n◆Su Discernimiento y su Defensa espiritual aumentan en 1 (esto también incrementa las siguientes características).\n◆Obtiene una bonificación de +1 a las pruebas de Percepción, Perspicacia y Supervivencia."
   }
  ],
  "acciones": []
 },
 {
  "id": "clavo:hierro",
  "familia": "clavo",
  "metal": "hierro",
  "nombre": "Clavo de hierro",
  "era": null,
  "rangoMin": 2,
  "desc": "Un clavo de hierro roba fuerza física. Si un personaje cuenta con cuatro o más de estos clavos, se activa su transformación en koloss.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Clavo de hierro",
    "texto": "El adversario obtiene los beneficios siguientes:\n◆Su atributo de Fuerza y su Defensa física aumentan en 1 (esto también incrementa las siguientes características).\n◆Su salud aumenta en una cantidad igual a su rango.\n◆Obtiene una bonificación de +1 a las pruebas de Atletismo.\n◆Sus acciones de Acometida obtienen una bonificación de +1 a la tirada de ataque y, si impactan, también a la tirada de daño."
   }
  ],
  "acciones": []
 },
 {
  "id": "clavo:laton",
  "familia": "clavo",
  "metal": "laton",
  "nombre": "Clavo de latón",
  "era": null,
  "rangoMin": 3,
  "desc": "Un clavo de latón roba un poder feruquímico cognitivo.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Clavo de latón",
    "texto": "Añade uno de los siguientes módulos de feruquimia: bronce, cobre, cinc o latón. Si el adversario ya tiene ese módulo, en su lugar se le considera de un rango superior para dicho módulo."
   }
  ],
  "acciones": []
 },
 {
  "id": "clavo:oro",
  "familia": "clavo",
  "metal": "oro",
  "nombre": "Clavo de oro",
  "era": null,
  "rangoMin": 3,
  "desc": "Un clavo de oro roba un poder feruquímico híbrido.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Clavo de oro",
    "texto": "Añade uno de los siguientes módulos de feruquimia: bendaleo, cadmio, electro u oro. Si el adversario ya tiene ese módulo, en su lugar se le considera de un rango superior para dicho módulo."
   }
  ],
  "acciones": []
 },
 {
  "id": "clavo:peltre",
  "familia": "clavo",
  "metal": "peltre",
  "nombre": "Clavo de peltre",
  "era": null,
  "rangoMin": 3,
  "desc": "Un clavo de peltre roba un poder feruquímico físico.",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Clavo de peltre",
    "texto": "Añade uno de los siguientes módulos de feruquimia: acero, estaño, hierro o peltre. Si el adversario ya tiene ese módulo, en su lugar se le considera de un rango superior para dicho módulo. Capítulo 8: Adversarios"
   }
  ],
  "acciones": []
 },
 {
  "id": "ascendencia:koloss",
  "familia": "ascendencia",
  "metal": "koloss",
  "nombre": "De sangre koloss",
  "era": null,
  "rangoMin": null,
  "desc": "",
  "reglas": "",
  "rasgos": [],
  "acciones": [
   {
    "tipo": "accion",
    "n": "Recuperación koloss",
    "texto": "El personaje de sangre koloss recupera una cantidad de salud igual a dos dados de recuperación (consulta “Voluntad” en el capítulo 3 del Manual de Nacidos de la Bruma). En cada escena, puede usar esta acción tantas veces como su rango.",
    "glifo": "1"
   },
   {
    "tipo": "accion",
    "n": "Recuperación reactiva",
    "texto": "Antes de que el personaje de sangre koloss sufra daño, usa su Recuperación koloss como r.",
    "glifo": "r",
    "rangoMin": 3
   }
  ]
 },
 {
  "id": "ascendencia:kandra",
  "familia": "ascendencia",
  "metal": "kandra",
  "nombre": "Kandra",
  "era": null,
  "rangoMin": null,
  "desc": "",
  "reglas": "",
  "rasgos": [
   {
    "tipo": "rasgo",
    "n": "Forma maleable",
    "texto": "El kandra puede ingerir los huesos de un personaje Mediano o de menor tamaño; hasta que esos huesos se retiren o se sustituyan por otro conjunto, puede imitar perfectamente la apariencia de ese personaje."
   },
   {
    "tipo": "rasgo",
    "n": "Identidad secreta",
    "texto": "Si los PJs empiezan a sospechar que hay un kandra entre ellos, crea el suceso positivo Descubrir al kandra con 3 espacios. Hasta que el medidor de suceso se llene con Oportunidades, nadie es de fiar y las capacidades que cuestan concentración pasan a costar 1 punto de concentración adicional. Cuando el medidor se completa, los personajes revelan la identidad del kandra, descubren una pista importante o confirman que no hay ningún kandra entre ellos."
   },
   {
    "tipo": "rasgo",
    "n": "Resistencias kandra",
    "texto": "El kandra ignora el rasgo Perforante de las armas al sufrir daño por laceración. Además, solo puede verse afectado por alomancia emocional si el alomante gasta 6 puntos o más de Investidura al Quemar latón o Quemar cinc; una vez afectado, el kandra no puede poner fin a esos efectos por sí mismo."
   }
  ],
  "acciones": []
 }
];
