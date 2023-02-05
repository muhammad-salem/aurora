## Reactive Scope


JavaScript is knowing with a one type of scope that can handle define a new variables,
set/update a value, delete the variables.


## Definition of Reactive Scope:

A reactive scope is a normal scope (define/set/read/delete), but with the
ability to know when a variable has been changed
and apply an action after that change happen.

Let assume that we have an equation `z = x + y` that is defined inside a reactive scope.

So to recalculate the value of `z`,
we have to subscribe to the changes of the value of `x` and `y`.

## Reactive Scope Benefit:

We can get the benefit of this approach when linking two different language together,
like HTML with JavaScript,

It used to happen with onclick="run javascript code", and the scope was the global scope.

The reactive scope can provide this linking with a class scope created
by a `custom element` too, it can provide a one way binding or 2 way binding,
and can provide a link to the events too.
