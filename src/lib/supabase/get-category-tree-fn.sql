-- This function retrieves a hierarchical tree of product categories.
create or replace function get_category_tree()
returns json[]
language plpgsql
as $$
begin
  return array(
    select
      json_build_object(
        'name', p.name,
        'subcategories', (
          select coalesce(json_agg(c.name order by c.name), '[]'::json)
          from categories c
          where c.parent_id = p.id
        )
      )
    from
      categories p
    where
      p.parent_id is null
    order by
      p.name
  );
end;
$$;
