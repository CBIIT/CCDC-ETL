-- MySQL dump 10.13  Distrib 5.7.17, for Win64 (x86_64)
--
-- Host: localhost    Database: ccdc
-- ------------------------------------------------------
-- Server version	5.7.21-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `lu_terms`
--

DROP TABLE IF EXISTS `lu_terms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lu_terms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `term_category` varchar(45) NOT NULL,
  `term_name` varchar(45) NOT NULL,
  `definition` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lu_terms`
--

LOCK TABLES `lu_terms` WRITE;
/*!40000 ALTER TABLE `lu_terms` DISABLE KEYS */;
INSERT INTO `lu_terms` VALUES (37,'Data Element','Case Age','An age or age range of a subject in a case but which has no specified temporal reference. A lack of reference could be due to not having enough information to correctly interpret any reference point such as at the time of a trial, at the time of a diagnosis, or  at some other reference point. [Permissible Values: MITRE derived age value set from age ranges used in the PGDI catalog.]'),(38,'Data Element','Case Age at Diagnosis','An age of the individual in a case as calculated at the time of the individual\'s diagnosis. See Case Age for value set.'),(39,'Data Element','Case Age at Trial','An age of the individ ual in a case as calculated at the time of the project, study, or trial to which the case belongs. See Case Age for value set.'),(40,'Data Element','Case Disease Diagnosis','A classification of a disease or condition based on signs, symptoms, and laboratory findings belonging to the individual in a case. [Based on Data Element ICD-O Primary Disease Diagnosis Type, caDSR Public ID 6161032. Permissible Value Range is Malignant Neoplasm Histology Name, caDSR value domain 3081850. Context: NCI Standards. ].  This is just a suggested list. To be determined later. The ICD-O-3 code listed here: http://www.wolfbane.com/icd/icdo3.htm.'),(41,'Data Element','Case Ethnicity','A classification of the person in a case based on social groupings that are characterized by a distinctive social and cultural tradition maintained from generation to generation, a common history and origin, and a sense of identification with the group (definition based on the caDSR)'),(42,'Data Element','Case Gender','A self-reported or observed gender alignment that may or may not be the same as the sex at birth. This datum may be the only information provided for approximating the sex at birth.'),(43,'Data Element','Case ID','An identifier for a case that is at least unique within a project, study, or trial. (Not sure if this is redundant with research component id or data resource URI)'),(44,'Data Element','Case Proband','A proband is person in a family to receive genetic counseling and/or testing for a suspected hereditary risk or diagnosed disease. (Definition based on https://www.cancer.gov/publications/dictionaries/genetics-dictionary/def/proband.) A proband may or may not be affected with the disease in question.  If the value is true, then the case subject may have been diagnosed with the disease under studied.  If the value is false, then the case subject is a member of the family of a proband study participant.  The proband indicator for the case carries over to a sample taken from a case subject.'),(45,'Data Element','Case Race','A geographic ancestral origin category that is assigned to the person in a case based mainly on physical characteristics that are thought to be distinct and inherent. (definition based on NCIt Code C17049)'),(46,'Data Element','Case Sex','A determination of the sex of the individual with no known basis for the assignment.  The assignment may be self-declared, and may or may not be related to biology.'),(47,'Data Element','Case Sex at Birth','A determination of the sex of the individual in a case based on the morphology of the external genitals of the individual observed at birth.'),(48,'Data Element','Case Treatment Administered','A kind of therapeutic procedure administered to the subject to alter the course of a pathologic process.'),(49,'Data Element','Case Treatment Outcome','A subject\'s final outcome after a treatment was administered'),(50,'Data Element','Case Tumor Site','An anatomical location of a tumor which is the focus of a case.'),(51,'Data Element','Cell Line ID','An identifier for a cell line or data about a cell line. The value is unique within scope of at least one data repository.'),(52,'Data Element','Donor Age','An age or age range of a donor but which may have no specified temporal reference such as age at diagnosis, age at sampling.  [Permissible Values: MITRE derived age value set from age ranges used in the PGDI catalog.]'),(53,'Data Element','Donor Disease','A classification of a disease or condition based on signs, symptoms, and laboratory findings belonging to the individual in a case. [Definition based on Data Element  ICD-O Primary Disease Diagnosis Type, caDSR Public ID 6161032.] See Case Disease Diagnosis for value set.'),(54,'Data Element','Donor ID','An anonymized identifier for a donor of tissue or cell samples.'),(55,'Data Element','Donor Sex','A determination of the sex of the individual with no known basis for the assignment.  The assignment may be self-declared, and may or may not be related to biology.'),(56,'Data Element','Program ID','An identifier for a program that is at least unique within a research repository.'),(57,'Data Element','Program Name','A name that a program is known by.'),(58,'Data Element','Project Anatomic Site Studied','A part of the body that is a focus of a project or study.'),(59,'Data Element','Project Cancer Studied','A classification of a cancer type that is a focus of a study.'),(60,'Data Element','Project ID','An identifier for a project, trial, or study that is at least unique within a repository or program.'),(61,'Data Element','Project Name','A name that a project, trial, or study is known by.'),(62,'Data Element','Sample Analyte Type','A molecular type which describes a biospecimen, such as DNA. (Based on CUI: CL563160)'),(63,'Data Element','Sample Anatomic Site','An anatomical location from which a sample was obtained unless the sample is a xenograft. If the sample is a xenograft then anatomical location is that of the donor, not the animal. Value lists from Data Element: 4742851 - caDSR; Anatomic Site Value Domain ID 4132131'),(64,'Data Element','Sample Assay Method','A classification of a molecular analysis method used for analyzing a sample that determines the types of available output data. [MITRE drafted definition. Based on NCI data element caDSR Public ID 6142401. Permissible value range is caDSR Public ID 6141168. User Context: GDC.  Alternative name and definition - [Sample] Molecular Analysis [Method] (Code C19770), NCIt]'),(65,'Data Element','Sample Composition Type','A type of any material sample taken from a biological entity for testing, diagnostic, propagation, treatment or research purposes, including a sample obtained from a living organism or taken from the biological object after halting of all its life functions. Biospecimen can contain one or more components including but not limited to cellular molecules, cells, tissues, organs, body fluids, embryos, and body excretory products. Also known as Specimen Characteristics. [Definition source: https://docs.gdc.cancer.gov/Data_Dictionary/viewer/#?view=table-definition-view&id=sample. Value range copied from GDC\'s molecular_test.biospecimen_type. No reference do the caDSR.]'),(66,'Data Element','Sample ID','An identifier for a sample that is at least unique within a project, study, or trial, or within a bio-specimen repository (registry, catalog, manifest, …).'),(67,'Data Element','Sample Is Normal','A question of whether the sample is healthy or not.  If the answer is true, the sample was taken from a healthy area of the body.  If false, the sample was taken from a diseased area of the body.'),(68,'Data Element','Sample Is Xenograft','An indicator for whether a sample was transplanted from a donor to a host. '),(69,'Data Element','Sample Repository Name','A clinical site that collected and/or provided this sample and clinical metadata for research use. (Based pm NCIt C103264, and )');
/*!40000 ALTER TABLE `lu_terms` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-09-07 23:58:03
