--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'feirante'
);


--
-- Name: feirante_segment; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.feirante_segment AS ENUM (
    'alimentacao',
    'roupas',
    'artesanato',
    'servicos',
    'outros',
    'doces',
    'joias',
    'tapetes'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'pago',
    'pendente',
    'atrasado'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  user_count INTEGER;
  assigned_role app_role;
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name, phone, whatsapp)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'whatsapp', '')
  );

  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  -- Assign role: first user is admin, others are feirante
  IF user_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'feirante';
  END IF;

  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, assigned_role);

  RETURN new;
END;
$$;


--
-- Name: handle_new_user_with_role(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user_with_role() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from metadata, default to 'feirante'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'feirante')::app_role;
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, full_name, phone, whatsapp)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'whatsapp'
  );
  
  -- Insert into user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  RETURN NEW;
END;
$$;


--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;


--
-- Name: notify_admin_inscricao(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_admin_inscricao() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  admin_user_id uuid;
  feirante_name text;
  feira_name text;
BEGIN
  -- Get first admin user
  SELECT user_id INTO admin_user_id
  FROM public.user_roles
  WHERE role = 'admin'
  LIMIT 1;
  
  -- Get feirante name and feira name
  SELECT p.full_name, f.nome INTO feirante_name, feira_name
  FROM public.feirantes fe
  JOIN public.profiles p ON p.id = fe.user_id
  JOIN public.feiras f ON f.id = NEW.feira_id
  WHERE fe.id = NEW.feirante_id;
  
  -- Insert notification for admin
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_id)
    VALUES (
      admin_user_id,
      'Nova inscrição recebida',
      feirante_name || ' se inscreveu na feira "' || feira_name || '".',
      'nova_inscricao',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: notify_feirantes_new_feira(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.notify_feirantes_new_feira() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Insert notification for all feirantes
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  SELECT 
    f.user_id,
    'Nova feira disponível',
    'Uma nova feira "' || NEW.nome || '" foi criada e está disponível para inscrição.',
    'nova_feira',
    NEW.id
  FROM public.feirantes f;
  
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: avaliacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.avaliacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    feirante_id uuid NOT NULL,
    feira_id uuid NOT NULL,
    data_feira date NOT NULL,
    avaliacao integer,
    comentario text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT avaliacoes_avaliacao_check CHECK (((avaliacao >= 1) AND (avaliacao <= 5)))
);


--
-- Name: feirantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feirantes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    cpf_cnpj text NOT NULL,
    segmento public.feirante_segment NOT NULL,
    tamanho_barraca text,
    ponto_fixo boolean DEFAULT false,
    bloqueado boolean DEFAULT false,
    motivo_bloqueio text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    ticket_medio numeric,
    descricao text,
    fotos_url text[]
);


--
-- Name: feiras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feiras (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    endereco text NOT NULL,
    latitude numeric(10,8),
    longitude numeric(11,8),
    dias_semana text[] NOT NULL,
    horario_inicio time without time zone NOT NULL,
    horario_fim time without time zone NOT NULL,
    horario_limite_montagem time without time zone NOT NULL,
    regras_evento text,
    politica_cancelamento text,
    horas_cancelamento_sem_multa integer DEFAULT 24,
    taxa_cancelamento numeric(10,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    cidade text DEFAULT 'Goiânia'::text NOT NULL,
    bairro text DEFAULT ''::text NOT NULL,
    tipo_feira text DEFAULT 'publica'::text NOT NULL,
    formas_pagamento text[] DEFAULT ARRAY['pix'::text, 'debito'::text, 'credito'::text] NOT NULL,
    avisos text,
    observacoes text,
    tempo_antecedencia_minutos integer DEFAULT 30 NOT NULL,
    valor_participacao numeric DEFAULT 0,
    taxa_energia numeric DEFAULT 0,
    taxa_limpeza numeric DEFAULT 0,
    taxa_seguranca numeric DEFAULT 0,
    recorrente boolean DEFAULT false,
    segmento_exclusivo boolean DEFAULT false,
    CONSTRAINT feiras_tipo_feira_check CHECK ((tipo_feira = ANY (ARRAY['publica'::text, 'condominio'::text])))
);


--
-- Name: inscricoes_feiras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inscricoes_feiras (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    feira_id uuid NOT NULL,
    feirante_id uuid NOT NULL,
    data_inscricao timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    status text DEFAULT 'pendente'::text NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    segmento_inscrito public.feirante_segment
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    related_id uuid,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: pagamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagamentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    feirante_id uuid NOT NULL,
    feira_id uuid NOT NULL,
    data_referencia date NOT NULL,
    taxa_participacao numeric(10,2) DEFAULT 0 NOT NULL,
    taxa_energia numeric(10,2) DEFAULT 0,
    taxa_limpeza numeric(10,2) DEFAULT 0,
    taxa_seguranca numeric(10,2) DEFAULT 0,
    valor_total numeric(10,2) NOT NULL,
    status public.payment_status DEFAULT 'pendente'::public.payment_status NOT NULL,
    data_pagamento timestamp with time zone,
    metodo_pagamento text,
    comprovante_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: produtos_feirante; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.produtos_feirante (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    feirante_id uuid NOT NULL,
    categoria text NOT NULL,
    subcategoria text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    phone text,
    whatsapp text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    foto_url text
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);


--
-- Name: vendas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    feirante_id uuid NOT NULL,
    feira_id uuid NOT NULL,
    data_feira date NOT NULL,
    valor_vendido numeric(10,2) NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: avaliacoes avaliacoes_feirante_id_feira_id_data_feira_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_feirante_id_feira_id_data_feira_key UNIQUE (feirante_id, feira_id, data_feira);


--
-- Name: avaliacoes avaliacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_pkey PRIMARY KEY (id);


--
-- Name: feirantes feirantes_cpf_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feirantes
    ADD CONSTRAINT feirantes_cpf_cnpj_key UNIQUE (cpf_cnpj);


--
-- Name: feirantes feirantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feirantes
    ADD CONSTRAINT feirantes_pkey PRIMARY KEY (id);


--
-- Name: feirantes feirantes_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feirantes
    ADD CONSTRAINT feirantes_user_id_key UNIQUE (user_id);


--
-- Name: feiras feiras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feiras
    ADD CONSTRAINT feiras_pkey PRIMARY KEY (id);


--
-- Name: inscricoes_feiras inscricoes_feiras_feira_id_feirante_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscricoes_feiras
    ADD CONSTRAINT inscricoes_feiras_feira_id_feirante_id_key UNIQUE (feira_id, feirante_id);


--
-- Name: inscricoes_feiras inscricoes_feiras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscricoes_feiras
    ADD CONSTRAINT inscricoes_feiras_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: pagamentos pagamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_pkey PRIMARY KEY (id);


--
-- Name: produtos_feirante produtos_feirante_feirante_id_categoria_subcategoria_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos_feirante
    ADD CONSTRAINT produtos_feirante_feirante_id_categoria_subcategoria_key UNIQUE (feirante_id, categoria, subcategoria);


--
-- Name: produtos_feirante produtos_feirante_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos_feirante
    ADD CONSTRAINT produtos_feirante_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: vendas vendas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT vendas_pkey PRIMARY KEY (id);


--
-- Name: idx_feiras_recorrente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feiras_recorrente ON public.feiras USING btree (recorrente) WHERE (recorrente = true);


--
-- Name: idx_inscricoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscricoes_status ON public.inscricoes_feiras USING btree (status, feira_id);


--
-- Name: user_roles_user_role_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_roles_user_role_unique ON public.user_roles USING btree (user_id, role);


--
-- Name: feirantes feirantes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER feirantes_updated_at BEFORE UPDATE ON public.feirantes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: feiras feiras_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER feiras_updated_at BEFORE UPDATE ON public.feiras FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: feiras on_feira_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_feira_created AFTER INSERT ON public.feiras FOR EACH ROW EXECUTE FUNCTION public.notify_feirantes_new_feira();


--
-- Name: inscricoes_feiras on_inscricao_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_inscricao_created AFTER INSERT ON public.inscricoes_feiras FOR EACH ROW EXECUTE FUNCTION public.notify_admin_inscricao();


--
-- Name: pagamentos pagamentos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER pagamentos_updated_at BEFORE UPDATE ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: profiles profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: inscricoes_feiras update_inscricoes_feiras_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_inscricoes_feiras_updated_at BEFORE UPDATE ON public.inscricoes_feiras FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


--
-- Name: avaliacoes avaliacoes_feira_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_feira_id_fkey FOREIGN KEY (feira_id) REFERENCES public.feiras(id) ON DELETE CASCADE;


--
-- Name: avaliacoes avaliacoes_feirante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avaliacoes
    ADD CONSTRAINT avaliacoes_feirante_id_fkey FOREIGN KEY (feirante_id) REFERENCES public.feirantes(id) ON DELETE CASCADE;


--
-- Name: feirantes feirantes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feirantes
    ADD CONSTRAINT feirantes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: inscricoes_feiras inscricoes_feiras_feira_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscricoes_feiras
    ADD CONSTRAINT inscricoes_feiras_feira_id_fkey FOREIGN KEY (feira_id) REFERENCES public.feiras(id) ON DELETE CASCADE;


--
-- Name: inscricoes_feiras inscricoes_feiras_feirante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscricoes_feiras
    ADD CONSTRAINT inscricoes_feiras_feirante_id_fkey FOREIGN KEY (feirante_id) REFERENCES public.feirantes(id) ON DELETE CASCADE;


--
-- Name: pagamentos pagamentos_feira_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_feira_id_fkey FOREIGN KEY (feira_id) REFERENCES public.feiras(id) ON DELETE CASCADE;


--
-- Name: pagamentos pagamentos_feirante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_feirante_id_fkey FOREIGN KEY (feirante_id) REFERENCES public.feirantes(id) ON DELETE CASCADE;


--
-- Name: produtos_feirante produtos_feirante_feirante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.produtos_feirante
    ADD CONSTRAINT produtos_feirante_feirante_id_fkey FOREIGN KEY (feirante_id) REFERENCES public.feirantes(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: vendas vendas_feira_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT vendas_feira_id_fkey FOREIGN KEY (feira_id) REFERENCES public.feiras(id) ON DELETE CASCADE;


--
-- Name: vendas vendas_feirante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendas
    ADD CONSTRAINT vendas_feirante_id_fkey FOREIGN KEY (feirante_id) REFERENCES public.feirantes(id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: feirantes Admins can manage feirantes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage feirantes" ON public.feirantes USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: feiras Admins can manage feiras; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage feiras" ON public.feiras USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: pagamentos Admins can manage pagamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage pagamentos" ON public.pagamentos USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: avaliacoes Admins can view all avaliacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all avaliacoes" ON public.avaliacoes FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: feirantes Admins can view all feirantes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all feirantes" ON public.feirantes FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: pagamentos Admins can view all pagamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all pagamentos" ON public.pagamentos FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: produtos_feirante Admins can view all products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all products" ON public.produtos_feirante FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: vendas Admins can view all vendas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all vendas" ON public.vendas FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: inscricoes_feiras Admins podem gerenciar inscrições; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar inscrições" ON public.inscricoes_feiras USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: inscricoes_feiras Admins podem ver todas as inscrições; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem ver todas as inscrições" ON public.inscricoes_feiras FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: feiras Anyone authenticated can view feiras; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone authenticated can view feiras" ON public.feiras FOR SELECT TO authenticated USING (true);


--
-- Name: user_roles Bootstrap first admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Bootstrap first admin" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (((role = 'admin'::public.app_role) AND (NOT (EXISTS ( SELECT 1
   FROM public.user_roles ur
  WHERE (ur.role = 'admin'::public.app_role))))));


--
-- Name: feirantes Feirantes can create their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Feirantes can create their own profile" ON public.feirantes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: avaliacoes Feirantes can insert their own avaliacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Feirantes can insert their own avaliacoes" ON public.avaliacoes FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.feirantes
  WHERE ((feirantes.id = avaliacoes.feirante_id) AND (feirantes.user_id = auth.uid())))));


--
-- Name: vendas Feirantes can insert their own vendas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Feirantes can insert their own vendas" ON public.vendas FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.feirantes
  WHERE ((feirantes.id = vendas.feirante_id) AND (feirantes.user_id = auth.uid())))));


--
-- Name: produtos_feirante Feirantes can manage their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Feirantes can manage their own products" ON public.produtos_feirante USING ((EXISTS ( SELECT 1
   FROM public.feirantes
  WHERE ((feirantes.id = produtos_feirante.feirante_id) AND (feirantes.user_id = auth.uid())))));


--
-- Name: avaliacoes Feirantes can view their own avaliacoes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Feirantes can view their own avaliacoes" ON public.avaliacoes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.feirantes
  WHERE ((feirantes.id = avaliacoes.feirante_id) AND (feirantes.user_id = auth.uid())))));


--
-- Name: feirantes Feirantes can view their own data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Feirantes can view their own data" ON public.feirantes FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: pagamentos Feirantes can view their own pagamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Feirantes can view their own pagamentos" ON public.pagamentos FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.feirantes
  WHERE ((feirantes.id = pagamentos.feirante_id) AND (feirantes.user_id = auth.uid())))));


--
-- Name: vendas Feirantes can view their own vendas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Feirantes can view their own vendas" ON public.vendas FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.feirantes
  WHERE ((feirantes.id = vendas.feirante_id) AND (feirantes.user_id = auth.uid())))));


--
-- Name: inscricoes_feiras Feirantes podem criar suas próprias inscrições; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Feirantes podem criar suas próprias inscrições" ON public.inscricoes_feiras FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.feirantes
  WHERE ((feirantes.id = inscricoes_feiras.feirante_id) AND (feirantes.user_id = auth.uid())))));


--
-- Name: inscricoes_feiras Feirantes podem ver suas próprias inscrições; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Feirantes podem ver suas próprias inscrições" ON public.inscricoes_feiras FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.feirantes
  WHERE ((feirantes.id = inscricoes_feiras.feirante_id) AND (feirantes.user_id = auth.uid())))));


--
-- Name: user_roles Users can self-assign feirante; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can self-assign feirante" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (role = 'feirante'::public.app_role)));


--
-- Name: notifications Users can update their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: notifications Users can view their own notifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: avaliacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: feirantes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feirantes ENABLE ROW LEVEL SECURITY;

--
-- Name: feiras; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feiras ENABLE ROW LEVEL SECURITY;

--
-- Name: inscricoes_feiras; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inscricoes_feiras ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: pagamentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

--
-- Name: produtos_feirante; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.produtos_feirante ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: vendas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


