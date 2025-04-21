CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION generate_alphanumeric_id( _length integer)
RETURNS text AS
$$
SELECT upper(
            substring(
          regexp_replace(
            encode(gen_random_bytes(CASE WHEN _length > 0 THEN _length ELSE 1 END), 'base64'), -- Generate ~_length bytes
            '[^a-zA-Z0-9]',
            '', 'g'
          ),
          1, _length
        )
       );
$$ LANGUAGE sql VOLATILE;