create table roles(
role_id serial primary key, 
role_name varchar(100) not null
);

INSERT INTO roles (role_name) values ('Admin'),('Sales');

create table users(
user_id serial primary key,
user_name varchar(100) not null,
passwords varchar(255) not null,
role_id int references roles(role_id)
);
--RESTARTING SERIAL SEQUENCE
SELECT pg_get_serial_sequence('users', 'user_id');
alter sequence public.users_user_id_seq RESTART WITH 1;


create table person_type(
type_id serial primary key,
person_type varchar(100) not null
);
insert into person_type (person_type) values ('Customer'),
                                             ('Vendor');

create table address(
address_id serial primary key,
address_name varchar(255) not null,
type_id int references person_type(type_id) not null,
locations varchar(255),
pincode decimal(8,0) not null,
user_id int references users(user_id) not null,
address_date timestamp default current_timestamp 
);

--alter table address add column address_date timestamp default current_timestamp;

create table product(
product_id serial primary key,
product_name varchar(255)
);


create table grn(
grn_id serial primary key,
address_id int references address(address_id) not null,
product_id int references product(product_id) not null,
grn_amount decimal(10,2) not null,
grn_quantity decimal(10,0) not null,
grn_date timestamp default current_timestamp,
user_id int references users(user_id) not null
);
SELECT pg_get_serial_sequence('grn', 'grn_id');
alter sequence public.grn_grn_id_seq RESTART WITH 1;



create table invoice(
    invoice_id serial primary key,
    address_id int references address(address_id) not null
);

create table sale(
sale_id serial primary key,
product_id int references product(product_id) not null,
grn_id int references grn(grn_id) not null,
sale_amount decimal(10,2) not null,
sale_quantity decimal(10,0) not null,
sale_date timestamp default current_timestamp,
user_id int references users(user_id) not null,
invoice_id int references invoice(invoice_id) not null
);


select grn_id,p.product_name,a.address_name,g.grn_quantity from grn g 
                                                           join address a 
                                                           on g.address_id=a.address_id 
                                                           join product p 
                                                           on p.product_id=g.product_id
                                                           where p.product_id=1  order by g.grn_date asc;

                                                           CREATE OR REPLACE FUNCTION get_quantity_difference(product_name TEXT)
RETURNS INTEGER AS $$
DECLARE
    grn_total_quantity NUMERIC;
    sale_total_quantity NUMERIC;
BEGIN
    -- Calculate total GRN quantity
    SELECT SUM(g.grn_quantity)
    INTO grn_total_quantity
    FROM grn g
    JOIN product p ON g.product_id = p.product_id
    WHERE p.product_name = $1
    GROUP BY p.product_name;

    -- Calculate total sales quantity
    SELECT SUM(s.sale_quantity)
    INTO sale_total_quantity
    FROM grn g
    JOIN product p ON g.product_id = p.product_id
    JOIN sale s ON s.grn_id = g.grn_id
    WHERE p.product_name = $1
    GROUP BY p.product_name;

    -- Return the difference as an integer
    RETURN COALESCE(grn_total_quantity, 0)::INTEGER - COALESCE(sale_total_quantity, 0)::INTEGER;
END;
$$ LANGUAGE plpgsql;

SELECT get_quantity_difference('Laptop');


select a.address_name,p.product_name,g.grn_quantity,g.grn_amount,s.sale_quantity,s.sale_amount from sale s 
                                                                                               join grn g on g.grn_id=s.grn_id 
                                                                                               join product p on p.product_id =s.product_id 
                                                                                               join invoice i on i.invoice_id =s.invoice_id 
                                                                                               join address a on a.address_id=i.address_id;

CREATE OR REPLACE FUNCTION user_dup_check(username varchar,roleid int)
RETURNS boolean
AS
$$
DECLARE
rec RECORD;
BEGIN
SELECT INTO rec * from users where user_name=username and role_id=roleid;
if rec.user_name is null then
return false;
else
return true;
end if;
END
$$ LANGUAGE plpgsql;




select p.product_name,sum(s.sale_amount)-sum(g.grn_amount) as Profit,sum(g.grn_quantity)-sum(s.sale_quantity) as Quantity from sale s 
                                                                                                                         join grn g on g.grn_id=s.grn_id 
                                                                                                                         join product p on p.product_id =s.product_id 
                                                                                                                         join invoice i on i.invoice_id =s.invoice_id 
                                                                                                                         join address a on a.address_id=i.address_id 
                                                                                                                         group by p.product_name              