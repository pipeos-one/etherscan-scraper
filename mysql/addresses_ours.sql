-- phpMyAdmin SQL Dump
-- version 4.9.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jan 10, 2020 at 11:04 PM
-- Server version: 10.4.8-MariaDB
-- PHP Version: 7.3.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `os_etherscan_mainnet`
--

-- --------------------------------------------------------

--
-- Table structure for table `addresses`
--

CREATE TABLE `addresses` (
  `id` int(11) NOT NULL,
  `address` varchar(45) NOT NULL,
  `blockscout` smallint(1) DEFAULT 0,
  `verified` smallint(1) DEFAULT 0,
  `checked` smallint(1) DEFAULT 0,
  `failed` smallint(1) DEFAULT 0,
  `contractName` varchar(125) DEFAULT NULL,
  `compilerVersion` varchar(45) DEFAULT NULL,
  `optimization` tinyint(4) DEFAULT NULL,
  `runs` int(11) DEFAULT NULL,
  `evmVersion` varchar(45) DEFAULT NULL,
  `sourceCode` longtext DEFAULT NULL,
  `bytecode` longblob DEFAULT NULL,
  `constructorArguments` blob DEFAULT NULL,
  `libraries` varchar(10000) DEFAULT NULL,
  `abi` text CHARACTER SET utf8 DEFAULT NULL,
  `block` int(11) DEFAULT NULL,
  `txhash` varchar(100) DEFAULT NULL,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  `sourcemap` longtext DEFAULT NULL,
  `swarm` varchar(255) DEFAULT NULL,
  `license` varchar(255) DEFAULT NULL,
  `sourceCodeJson` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `addresses`
--
ALTER TABLE `addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `address` (`address`),
  ADD KEY `checked` (`checked`,`blockscout`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `addresses`
--
ALTER TABLE `addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
