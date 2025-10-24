-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 24-10-2025 a las 07:51:14
-- Versión del servidor: 10.4.28-MariaDB
-- Versión de PHP: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `SwiftPass`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Imagenes`
--

CREATE TABLE `Imagenes` (
  `id_imagen` int(11) NOT NULL,
  `id_record` int(11) NOT NULL,
  `tabla_origen` varchar(20) NOT NULL,
  `src` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Justificantes`
--

CREATE TABLE `Justificantes` (
  `id_justificante` int(11) NOT NULL,
  `id_maestro` int(11) NOT NULL,
  `motivo` varchar(255) NOT NULL,
  `fecha` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Maestros`
--

CREATE TABLE `Maestros` (
  `id_maestro` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `correo` varchar(50) NOT NULL,
  `telefono` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

--
-- Volcado de datos para la tabla `Maestros`
--

INSERT INTO `Maestros` (`id_maestro`, `nombre`, `correo`, `telefono`) VALUES
(1, 'Rodrigo Melanzadez', 'Rodrigo_Melanzadez@academicos.udg.mx', '3309562915'),
(2, 'María González', 'maria.gonzalez@escuela.edu.mx', '3312457890'),
(3, 'Juan Pérez', 'juan.perez@escuela.edu.mx', '3325897412'),
(4, 'Laura Hernández', 'laura.hernandez@escuela.edu.mx', '3336748291'),
(5, 'Carlos Ramírez', 'carlos.ramirez@escuela.edu.mx', '3341826579'),
(6, 'Ana Torres', 'ana.torres@escuela.edu.mx', '3354791268');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Materias`
--

CREATE TABLE `Materias` (
  `id_materia` int(11) NOT NULL,
  `id_maestro` int(11) NOT NULL,
  `nombre_materia` varchar(90) NOT NULL,
  `salon` varchar(15) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `NFC_Maestros`
--

CREATE TABLE `NFC_Maestros` (
  `id_nfc` int(11) NOT NULL,
  `id_maestro` int(11) NOT NULL,
  `uid` varchar(50) NOT NULL,
  `fecha_asignacion` datetime NOT NULL DEFAULT current_timestamp(),
  `acces` int(2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

--
-- Volcado de datos para la tabla `NFC_Maestros`
--

INSERT INTO `NFC_Maestros` (`id_nfc`, `id_maestro`, `uid`, `fecha_asignacion`, `acces`) VALUES
(1, 1, '73:4E:6E:F5', '2025-10-22 14:08:45', 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Permisos`
--

CREATE TABLE `Permisos` (
  `id_permiso` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `nombre_permiso` varchar(100) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `aprobado` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Registro_Asistencias`
--

CREATE TABLE `Registro_Asistencias` (
  `id_asistencia` int(11) NOT NULL,
  `id_maestro` int(11) NOT NULL,
  `id_nfc` int(11) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  `status` int(10) NOT NULL DEFAULT 3 COMMENT '1:Jus 2: Permiso 3: Falta 4:Asist'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

--
-- Volcado de datos para la tabla `Registro_Asistencias`
--

INSERT INTO `Registro_Asistencias` (`id_asistencia`, `id_maestro`, `id_nfc`, `fecha`, `status`) VALUES
(1, 1, 1, '2025-10-23 14:47:40', 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Regristro_no_permitido`
--

CREATE TABLE `Regristro_no_permitido` (
  `id_regristro_no_p` int(10) NOT NULL,
  `targeta_nfc` varchar(100) NOT NULL,
  `fecha` datetime DEFAULT current_timestamp(),
  `motivo` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

--
-- Volcado de datos para la tabla `Regristro_no_permitido`
--

INSERT INTO `Regristro_no_permitido` (`id_regristro_no_p`, `targeta_nfc`, `fecha`, `motivo`) VALUES
(1, '?', '2025-10-23 14:49:39', '?'),
(2, 'F5:35:8E:BF', '2025-10-23 14:51:04', 'Targeta no registrada'),
(3, '73:4E:6E:F5', '2025-10-23 14:51:31', 'Acceso denegado por administrador'),
(4, '73:4E:6E:F5', '2025-10-23 23:36:24', 'Acceso denegado por administrador');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Reportes`
--

CREATE TABLE `Reportes` (
  `id_reporte` int(11) NOT NULL,
  `id_maestro` int(11) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `Usuarios`
--

CREATE TABLE `Usuarios` (
  `id_usuario` int(11) NOT NULL,
  `id_maestro` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish2_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `Imagenes`
--
ALTER TABLE `Imagenes`
  ADD PRIMARY KEY (`id_imagen`);

--
-- Indices de la tabla `Justificantes`
--
ALTER TABLE `Justificantes`
  ADD PRIMARY KEY (`id_justificante`),
  ADD KEY `id_maestro` (`id_maestro`);

--
-- Indices de la tabla `Maestros`
--
ALTER TABLE `Maestros`
  ADD PRIMARY KEY (`id_maestro`);

--
-- Indices de la tabla `Materias`
--
ALTER TABLE `Materias`
  ADD PRIMARY KEY (`id_materia`),
  ADD KEY `id_maestro` (`id_maestro`);

--
-- Indices de la tabla `NFC_Maestros`
--
ALTER TABLE `NFC_Maestros`
  ADD PRIMARY KEY (`id_nfc`),
  ADD UNIQUE KEY `uid` (`uid`),
  ADD KEY `id_maestro` (`id_maestro`);

--
-- Indices de la tabla `Permisos`
--
ALTER TABLE `Permisos`
  ADD PRIMARY KEY (`id_permiso`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `Registro_Asistencias`
--
ALTER TABLE `Registro_Asistencias`
  ADD PRIMARY KEY (`id_asistencia`),
  ADD KEY `id_maestro` (`id_maestro`),
  ADD KEY `id_nfc` (`id_nfc`);

--
-- Indices de la tabla `Regristro_no_permitido`
--
ALTER TABLE `Regristro_no_permitido`
  ADD PRIMARY KEY (`id_regristro_no_p`);

--
-- Indices de la tabla `Reportes`
--
ALTER TABLE `Reportes`
  ADD PRIMARY KEY (`id_reporte`),
  ADD KEY `id_maestro` (`id_maestro`);

--
-- Indices de la tabla `Usuarios`
--
ALTER TABLE `Usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `id_maestro` (`id_maestro`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `Imagenes`
--
ALTER TABLE `Imagenes`
  MODIFY `id_imagen` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `Justificantes`
--
ALTER TABLE `Justificantes`
  MODIFY `id_justificante` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `Maestros`
--
ALTER TABLE `Maestros`
  MODIFY `id_maestro` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `Materias`
--
ALTER TABLE `Materias`
  MODIFY `id_materia` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `NFC_Maestros`
--
ALTER TABLE `NFC_Maestros`
  MODIFY `id_nfc` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `Permisos`
--
ALTER TABLE `Permisos`
  MODIFY `id_permiso` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `Registro_Asistencias`
--
ALTER TABLE `Registro_Asistencias`
  MODIFY `id_asistencia` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `Regristro_no_permitido`
--
ALTER TABLE `Regristro_no_permitido`
  MODIFY `id_regristro_no_p` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `Reportes`
--
ALTER TABLE `Reportes`
  MODIFY `id_reporte` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `Usuarios`
--
ALTER TABLE `Usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `Justificantes`
--
ALTER TABLE `Justificantes`
  ADD CONSTRAINT `justificantes_ibfk_1` FOREIGN KEY (`id_maestro`) REFERENCES `Maestros` (`id_maestro`);

--
-- Filtros para la tabla `Materias`
--
ALTER TABLE `Materias`
  ADD CONSTRAINT `materias_ibfk_1` FOREIGN KEY (`id_maestro`) REFERENCES `Maestros` (`id_maestro`);

--
-- Filtros para la tabla `NFC_Maestros`
--
ALTER TABLE `NFC_Maestros`
  ADD CONSTRAINT `nfc_maestros_ibfk_1` FOREIGN KEY (`id_maestro`) REFERENCES `Maestros` (`id_maestro`);

--
-- Filtros para la tabla `Permisos`
--
ALTER TABLE `Permisos`
  ADD CONSTRAINT `permisos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `Usuarios` (`id_usuario`);

--
-- Filtros para la tabla `Registro_Asistencias`
--
ALTER TABLE `Registro_Asistencias`
  ADD CONSTRAINT `registro_asistencias_ibfk_1` FOREIGN KEY (`id_maestro`) REFERENCES `Maestros` (`id_maestro`),
  ADD CONSTRAINT `registro_asistencias_ibfk_2` FOREIGN KEY (`id_nfc`) REFERENCES `NFC_Maestros` (`id_nfc`);

--
-- Filtros para la tabla `Reportes`
--
ALTER TABLE `Reportes`
  ADD CONSTRAINT `reportes_ibfk_1` FOREIGN KEY (`id_maestro`) REFERENCES `Maestros` (`id_maestro`);

--
-- Filtros para la tabla `Usuarios`
--
ALTER TABLE `Usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_maestro`) REFERENCES `Maestros` (`id_maestro`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
