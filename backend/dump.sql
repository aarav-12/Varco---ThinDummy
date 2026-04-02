--
-- PostgreSQL database dump
--

\restrict A7G0aXmzbGBp9Fo2PzfUQVpPW3YZ0Pw8jgQFmVxlt8AFxQtUNghAHEqWpAtlisH

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: sender_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.sender_role AS ENUM (
    'doctor',
    'patient'
);


ALTER TYPE public.sender_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    name character varying(100),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    doctor_id integer,
    patient_name character varying(255),
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    status character varying(20)
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_id_seq OWNER TO postgres;

--
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    patient_id integer NOT NULL,
    sender public.sender_role NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_id_seq OWNER TO postgres;

--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: doctor_availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_availability (
    id integer NOT NULL,
    doctor_id integer,
    day_of_week character varying(10),
    start_time time without time zone,
    end_time time without time zone,
    slot_duration integer
);


ALTER TABLE public.doctor_availability OWNER TO postgres;

--
-- Name: doctor_availability_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctor_availability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_availability_id_seq OWNER TO postgres;

--
-- Name: doctor_availability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_availability_id_seq OWNED BY public.doctor_availability.id;


--
-- Name: patient_recommendations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patient_recommendations (
    id integer NOT NULL,
    domain text NOT NULL,
    recommendation text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    patient_id uuid
);


ALTER TABLE public.patient_recommendations OWNER TO postgres;

--
-- Name: patient_recommendations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.patient_recommendations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patient_recommendations_id_seq OWNER TO postgres;

--
-- Name: patient_recommendations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.patient_recommendations_id_seq OWNED BY public.patient_recommendations.id;


--
-- Name: patients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patients (
    old_id integer CONSTRAINT patients_id_not_null NOT NULL,
    name character varying(100),
    age integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ai_summary text,
    raw_inputs jsonb DEFAULT '{}'::jsonb,
    biomarkers jsonb DEFAULT '{}'::jsonb,
    risk_scores jsonb DEFAULT '{}'::jsonb,
    biological_age integer,
    chronological_age integer,
    gender character varying(20),
    algorithm_version character varying(20),
    id uuid DEFAULT gen_random_uuid() CONSTRAINT patients_uuid_id_not_null NOT NULL
);


ALTER TABLE public.patients OWNER TO postgres;

--
-- Name: patients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.patients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patients_id_seq OWNER TO postgres;

--
-- Name: patients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.patients_id_seq OWNED BY public.patients.old_id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text,
    age integer,
    biomarkers jsonb,
    results jsonb,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: doctor_availability id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_availability ALTER COLUMN id SET DEFAULT nextval('public.doctor_availability_id_seq'::regclass);


--
-- Name: patient_recommendations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_recommendations ALTER COLUMN id SET DEFAULT nextval('public.patient_recommendations_id_seq'::regclass);


--
-- Name: patients old_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients ALTER COLUMN old_id SET DEFAULT nextval('public.patients_id_seq'::regclass);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (id, email, password_hash, name, created_at) FROM stdin;
fea3aff2-dc08-4bee-97f6-c3a056486128	aaravmithranivarco@gmail.com		Aarav	2026-04-02 17:44:30.220375+05:30
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (id, doctor_id, patient_name, start_time, end_time, status) FROM stdin;
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, patient_id, sender, message, created_at) FROM stdin;
1	1	patient	I have fever	2026-02-14 17:06:09.717616
2	1	doctor	Take rest and drink fluids	2026-02-14 17:45:07.962501
3	1	patient	what is this	2026-02-14 17:45:26.319565
4	1	doctor	dont worry you will survive	2026-02-14 17:46:02.499556
5	1	patient	okay thanyouo	2026-02-14 17:46:37.182922
6	1	patient	i have a problem	2026-02-14 17:51:37.616116
7	1	doctor	you will survive no worries	2026-02-14 17:51:48.418997
8	1	patient	dfgfdf	2026-02-14 17:55:05.684954
9	1	patient	vvfdvdvv	2026-02-14 17:55:07.171882
10	1	patient	dvfvdvfvd	2026-02-14 17:55:09.899838
11	1	doctor	meowww	2026-02-14 17:55:15.923272
12	1	patient	Hello doctor	2026-02-15 16:44:34.334952
13	1	patient	hii	2026-02-15 19:13:08.896228
14	1	patient	hello	2026-03-07 17:46:59.873282
\.


--
-- Data for Name: doctor_availability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_availability (id, doctor_id, day_of_week, start_time, end_time, slot_duration) FROM stdin;
\.


--
-- Data for Name: patient_recommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patient_recommendations (id, domain, recommendation, created_at, updated_at, patient_id) FROM stdin;
1	inflammation	lodu + 7h sleep.	2026-04-02 17:00:13.20688	2026-04-02 17:01:07.542121	c554b6f1-75cb-4b04-b8b2-f0bd47121efb
\.


--
-- Data for Name: patients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patients (old_id, name, age, created_at, ai_summary, raw_inputs, biomarkers, risk_scores, biological_age, chronological_age, gender, algorithm_version, id) FROM stdin;
1	Aarav	22	2026-02-11 16:22:09.193911	\N	{"canWalk": null, "symptoms": "Back pain", "painLevel": 8, "hasSwelling": null}	{}	{}	\N	22	\N	\N	c554b6f1-75cb-4b04-b8b2-f0bd47121efb
2	Rahul	25	2026-02-12 15:54:15.212927	\N	{"canWalk": false, "symptoms": "Leg injury", "painLevel": 8, "hasSwelling": true}	{}	{}	\N	25	\N	\N	132e6b7a-e6a1-40e8-bb01-1463523cf228
3	Rahul	25	2026-02-12 15:57:07.918143	\N	{"canWalk": true, "symptoms": "Minor Pain", "painLevel": 8, "hasSwelling": true}	{}	{}	\N	25	\N	\N	ff5ba008-dcb5-484b-8489-19e6e49da5d5
4	Rahul	25	2026-02-12 15:57:39.593485	\N	{"canWalk": true, "symptoms": "string pain", "painLevel": 8, "hasSwelling": true}	{}	{}	\N	25	\N	\N	d8a55814-13c1-428e-af8b-e43ccdb21d4f
5	High Early	30	2026-02-12 16:44:19.183107	\N	{"canWalk": false, "symptoms": "Severe pain", "painLevel": 8, "hasSwelling": true}	{}	{}	\N	30	\N	\N	124a14d7-d31a-4d8f-84db-1abcaf2d6eb3
6	High Late	28	2026-02-12 16:44:29.018481	\N	{"canWalk": false, "symptoms": "Very severe", "painLevel": 9, "hasSwelling": true}	{}	{}	\N	28	\N	\N	966d2414-2f68-46ad-856b-090fe28b94da
7	High Early	30	2026-02-13 16:05:13.608435	An error occurred while generating the explanation.	{"canWalk": false, "symptoms": "Severe pain", "painLevel": 8, "hasSwelling": true}	{}	{}	\N	30	\N	\N	c6b4c563-b6c7-4829-b8ad-14c34eac0c2c
8	High Early	30	2026-02-13 16:07:35.934313	An error occurred while generating the explanation.	{"canWalk": false, "symptoms": "Severe pain", "painLevel": 8, "hasSwelling": true}	{}	{}	\N	30	\N	\N	7d8b9356-232f-492a-ab3a-5a09a69ba432
9	High Early	30	2026-02-13 16:09:09.238605	An error occurred while generating the explanation.	{"canWalk": false, "symptoms": "Severe pain", "painLevel": 8, "hasSwelling": true}	{}	{}	\N	30	\N	\N	934925aa-cca1-4b7a-9a40-e5c043c3adb9
10	High Early	30	2026-02-13 16:11:24.469012	High pain detected. Recommend consultation.	{"canWalk": false, "symptoms": "Severe pain", "painLevel": 8, "hasSwelling": true}	{}	{}	\N	30	\N	\N	becd8a03-a4c8-4bdf-b871-6796a0c7f92a
11	Test User	32	2026-02-15 14:52:50.552829	A pain level of undefined  suggests a low-risk situation.\n\nThis is commonly manageable with rest and basic self-care.\n\nStay hydrated, avoid overexertion, and observe the symptoms.\n\nIf anything unusual develops or persists, then consider medical advice.	{"canWalk": false, "symptoms": "Knee pain", "painLevel": 6, "hasSwelling": true}	{"BMF": 40, "CMF": 50, "IRF": 60, "MHF": 80, "PNF": 48.00000000000001, "RFF": 60, "VAF": 70}	{"BMF": "Moderate", "CMF": "Moderate", "IRF": "Moderate", "MHF": "Severe", "PNF": "Moderate", "RFF": "Moderate", "VAF": "Severe"}	35	32	Male	\N	f6907e88-4ce0-4367-8ccd-8517fa728b70
12	Test User	32	2026-02-15 15:05:44.449434	A pain level of undefined  suggests a low-risk situation.\n\nThis is commonly manageable with rest and basic self-care.\n\nStay hydrated, avoid overexertion, and observe the symptoms.\n\nIf anything unusual develops or persists, then consider medical advice.	{"canWalk": false, "symptoms": "Knee pain", "painLevel": 6, "hasSwelling": true}	{"BMF": 40, "CMF": 50, "IRF": 60, "MHF": 80, "PNF": 48.00000000000001, "RFF": 60, "VAF": 70}	{"BMF": "Moderate", "CMF": "Moderate", "IRF": "Moderate", "MHF": "Severe", "PNF": "Moderate", "RFF": "Moderate", "VAF": "Severe"}	35	32	Male	\N	d0bb28f7-105f-443f-8f97-2006eea95d33
13	Test User	32	2026-02-15 15:06:42.100388	A pain level of undefined  suggests a low-risk situation.\n\nThis is commonly manageable with rest and basic self-care.\n\nStay hydrated, avoid overexertion, and observe the symptoms.\n\nIf anything unusual develops or persists, then consider medical advice.	{"canWalk": false, "symptoms": "Knee pain", "painLevel": 6, "hasSwelling": true}	{"BMF": 40, "CMF": 50, "IRF": 60, "MHF": 80, "PNF": 48.00000000000001, "RFF": 60, "VAF": 70}	{"BMF": "Moderate", "CMF": "Moderate", "IRF": "Moderate", "MHF": "Severe", "PNF": "Moderate", "RFF": "Moderate", "VAF": "Severe"}	35	32	Male	\N	975fd50f-5bf5-4b74-8fab-8c7fd6cb13e3
14	Test User	32	2026-02-15 15:07:36.914841	A pain level of undefined  suggests a low-risk situation.\n\nThis is commonly manageable with rest and basic self-care.\n\nStay hydrated, avoid overexertion, and observe the symptoms.\n\nIf anything unusual develops or persists, then consider medical advice.	{"canWalk": false, "symptoms": "Knee pain", "painLevel": 6, "hasSwelling": true}	{"BMF": 40, "CMF": 50, "IRF": 60, "MHF": 80, "PNF": 48.00000000000001, "RFF": 60, "VAF": 70}	{"BMF": "Moderate", "CMF": "Moderate", "IRF": "Moderate", "MHF": "Severe", "PNF": "Moderate", "RFF": "Moderate", "VAF": "Severe"}	35	32	Male	\N	5e34d1c5-7388-4d49-9089-c8f106b308ca
15	Test User	32	2026-02-15 15:07:54.128164	A pain level of undefined  suggests a low-risk situation.\n\nThis is commonly manageable with rest and basic self-care.\n\nStay hydrated, avoid overexertion, and observe the symptoms.\n\nIf anything unusual develops or persists, then consider medical advice.	{"canWalk": false, "symptoms": "Knee pain", "painLevel": 6, "hasSwelling": true}	{"BMF": 40, "CMF": 50, "IRF": 60, "MHF": 80, "PNF": 48.00000000000001, "RFF": 60, "VAF": 70}	{"BMF": "Moderate", "CMF": "Moderate", "IRF": "Moderate", "MHF": "Severe", "PNF": "Moderate", "RFF": "Moderate", "VAF": "Severe"}	35	32	Male	\N	7789b06e-023b-4cb2-b15c-b7e1aa529d5e
16	Test User	32	2026-02-15 15:25:17.265918	A pain level of undefined  suggests a low-risk situation.\n\nThis is commonly manageable with rest and basic self-care.\n\nStay hydrated, avoid overexertion, and observe the symptoms.\n\nIf anything unusual develops or persists, then consider medical advice.	{"canWalk": false, "symptoms": "Knee pain", "painLevel": 6, "hasSwelling": true}	{"BMF": 40, "CMF": 50, "IRF": 60, "MHF": 80, "PNF": 48.00000000000001, "RFF": 60, "VAF": 70}	{"BMF": "Moderate", "CMF": "Moderate", "IRF": "Moderate", "MHF": "Severe", "PNF": "Moderate", "RFF": "Moderate", "VAF": "Severe"}	35	32	Male	\N	195266c2-5389-487c-8b9a-d484faf9e54e
17	Test User	32	2026-02-15 15:26:21.122577	A pain level of undefined  suggests a low-risk situation.\n\nThis is commonly manageable with rest and basic self-care.\n\nStay hydrated, avoid overexertion, and observe the symptoms.\n\nIf anything unusual develops or persists, then consider medical advice.	{"canWalk": false, "symptoms": "Knee pain", "painLevel": 6, "hasSwelling": true}	{"BMF": 40, "CMF": 50, "IRF": 60, "MHF": 80, "PNF": 48.00000000000001, "RFF": 60, "VAF": 70}	{"BMF": "Moderate", "CMF": "Moderate", "IRF": "Moderate", "MHF": "Severe", "PNF": "Moderate", "RFF": "Moderate", "VAF": "Severe"}	35	32	Male	\N	f50d1603-a973-42c3-97ca-45c804294249
18	Test User	32	2026-02-15 17:23:17.6485	Overall biomarker severity is Severe. Biological age is 2 years higher than chronological age.	{"canWalk": false, "symptoms": "knee stiffness", "painLevel": 6, "hasSwelling": true}	{"BMF": 40, "CMF": 50, "IRF": 60, "MHF": 80, "PNF": 48.00000000000001, "RFF": 60, "VAF": 70}	{"BMF": "Moderate", "CMF": "Moderate", "IRF": "Moderate", "MHF": "Severe", "PNF": "Moderate", "RFF": "Moderate", "VAF": "Severe"}	34	32	Male	\N	cc4646fc-b224-4f3b-99dc-a12de8c31143
19	Test User	32	2026-02-15 17:24:04.876391	Overall biomarker severity is Severe. Biological age is 2 years higher than chronological age.	{"canWalk": false, "symptoms": "knee stiffness", "painLevel": 6, "hasSwelling": true}	{"BMF": 40, "CMF": 50, "IRF": 60, "MHF": 80, "PNF": 48.00000000000001, "RFF": 60, "VAF": 70}	{"BMF": "Moderate", "CMF": "Moderate", "IRF": "Moderate", "MHF": "Severe", "PNF": "Moderate", "RFF": "Moderate", "VAF": "Severe"}	34	32	Male	\N	a1fa9da4-aa2f-499c-85b8-2d6d0d66255f
20	Test User	32	2026-02-15 17:26:51.031689	Overall biomarker severity is Severe. Biological age is 2 years higher than chronological age.	{"canWalk": false, "symptoms": "knee stiffness", "painLevel": 6, "hasSwelling": true}	{"BMF": 40, "CMF": 50, "IRF": 60, "MHF": 80, "PNF": 48.00000000000001, "RFF": 60, "VAF": 70}	{"BMF": "Moderate", "CMF": "Moderate", "IRF": "Moderate", "MHF": "Severe", "PNF": "Moderate", "RFF": "Moderate", "VAF": "Severe"}	34	32	Male	\N	5aaddbb3-1763-429f-83af-58d3e061e048
21	Test User	32	2026-02-15 17:31:32.720156	Overall biomarker severity is Severe. Biological age is 2 years higher than chronological age.	{"canWalk": false, "symptoms": "knee stiffness", "painLevel": 6, "hasSwelling": true}	{"BMF": 40, "CMF": 50, "IRF": 60, "MHF": 80, "PNF": 48.00000000000001, "RFF": 60, "VAF": 70}	{"BMF": "Moderate", "CMF": "Moderate", "IRF": "Moderate", "MHF": "Severe", "PNF": "Moderate", "RFF": "Moderate", "VAF": "Severe"}	34	32	Male	\N	d1f8b849-74e5-482a-9d80-3029deefec4f
22	Test User	32	2026-02-15 17:33:35.272682	\N	{"canWalk": false, "symptoms": "knee stiffness", "painLevel": 6, "hasSwelling": true}	{"BMF": 40, "CMF": 50, "IRF": 60, "MHF": 80, "PNF": 48.00000000000001, "RFF": 60, "VAF": 70}	{"BMF": "Moderate", "CMF": "Moderate", "IRF": "Moderate", "MHF": "Severe", "PNF": "Moderate", "RFF": "Moderate", "VAF": "Severe"}	34	32	Male	\N	809e5706-f1d9-4f5e-8351-53d8a39f4066
23	Test User	25	2026-04-02 17:17:26.734612	\N	{}	{}	{}	\N	\N	\N	\N	245242a2-7367-472d-8027-0e13c61aada7
24	Test User	25	2026-04-02 17:18:10.957125	\N	{}	{}	{}	\N	\N	\N	\N	b3528e54-b455-4cc0-ad81-a04dd73a4967
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, user_id, age, biomarkers, results, created_at) FROM stdin;
99cbc210-0068-420e-8695-dbdd648bfba7	demo-user	25	{"CRP": {"unit": "mg/L", "value": 2}, "LDL": {"unit": "mg/dL", "value": 135.345}, "Hemoglobin": {"unit": "g/dL", "value": 14}}	{"zScores": {"CRP": 0.3333333333333333, "LDL": 1.1781666666666666, "Hemoglobin": -0.25}, "deltaAge": 2.97, "insights": ["MODERATE LDL → cardiovascular risk"], "severity": {"CRP": 0.3333333333333333, "LDL": 1.1781666666666666, "Hemoglobin": 0.25}, "riskScore": 1.4, "confidence": 0.25, "domainScores": {"muscle": 0.25, "inflammation": 0.3333333333333333, "neurovascular": 1.1781666666666666}, "biologicalAge": 28, "compositeScore": 0.561343537414966, "domainContributions": {"muscle": 0.55, "inflammation": 0.65, "neurovascular": 2.16}}	2026-04-01 20:30:59.441479
4935b6ed-1321-4757-afbc-97b99e070e4a	demo-user	25	{"CRP": {"unit": "mg/L", "value": 2}, "LDL": {"unit": "mg/dL", "value": 135.345}, "Hemoglobin": {"unit": "g/dL", "value": 14}}	{"zScores": {"CRP": 0.3333333333333333, "LDL": 1.1781666666666666, "Hemoglobin": -0.25}, "deltaAge": 2.97, "insights": ["MODERATE LDL → cardiovascular risk"], "severity": {"CRP": 0.3333333333333333, "LDL": 1.1781666666666666, "Hemoglobin": 0.25}, "riskScore": 1.4, "confidence": 0.25, "domainScores": {"muscle": 0.25, "inflammation": 0.3333333333333333, "neurovascular": 1.1781666666666666}, "biologicalAge": 28, "compositeScore": 0.561343537414966, "domainContributions": {"muscle": 0.55, "inflammation": 0.65, "neurovascular": 2.16}}	2026-04-01 20:33:11.669265
af7e30b5-7fc2-456a-8463-66505d88ec68	demo-user	25	{"CRP": {"unit": "mg/L", "value": 2}, "LDL": {"unit": "mg/dL", "value": 135.345}, "Hemoglobin": {"unit": "g/dL", "value": 14}}	{"zScores": {"CRP": 0.3333333333333333, "LDL": 1.1781666666666666, "Hemoglobin": -0.25}, "deltaAge": 2.97, "insights": ["MODERATE LDL → cardiovascular risk"], "severity": {"CRP": 0.3333333333333333, "LDL": 1.1781666666666666, "Hemoglobin": 0.25}, "riskScore": 1.4, "confidence": 0.25, "domainScores": {"muscle": 0.25, "inflammation": 0.3333333333333333, "neurovascular": 1.1781666666666666}, "biologicalAge": 28, "compositeScore": 0.561343537414966, "domainContributions": {"muscle": 0.55, "inflammation": 0.65, "neurovascular": 2.16}}	2026-04-01 20:34:42.223415
\.


--
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointments_id_seq', 1, false);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 14, true);


--
-- Name: doctor_availability_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_availability_id_seq', 1, false);


--
-- Name: patient_recommendations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.patient_recommendations_id_seq', 3, true);


--
-- Name: patients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.patients_id_seq', 24, true);


--
-- Name: admins admins_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_email_key UNIQUE (email);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: doctor_availability doctor_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_availability
    ADD CONSTRAINT doctor_availability_pkey PRIMARY KEY (id);


--
-- Name: patient_recommendations patient_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_recommendations
    ADD CONSTRAINT patient_recommendations_pkey PRIMARY KEY (id);


--
-- Name: patients patients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patients
    ADD CONSTRAINT patients_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: patient_recommendations patient_recommendations_patient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patient_recommendations
    ADD CONSTRAINT patient_recommendations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict A7G0aXmzbGBp9Fo2PzfUQVpPW3YZ0Pw8jgQFmVxlt8AFxQtUNghAHEqWpAtlisH

